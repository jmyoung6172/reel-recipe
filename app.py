import os
import base64
import subprocess
import tempfile
import json
import glob
from flask import Flask, request, jsonify
import anthropic

app = Flask(__name__)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def download_reel(url: str, output_dir: str) -> str:
    output_path = os.path.join(output_dir, "reel.mp4")
    cmd = ["python", "-m", "yt_dlp", "--no-warnings", "-o", output_path]
    cookies_b64 = os.environ.get("COOKIES_B64", "")
    if cookies_b64:
        cookies_path = os.path.join(output_dir, "cookies.txt")
        with open(cookies_path, "wb") as f:
            f.write(base64.b64decode(cookies_b64))
        cmd += ["--cookies", cookies_path]
    cmd.append(url)
    result = subprocess.run(
        cmd,
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Download failed: {result.stderr}")
    return output_path


def extract_frames(video_path: str, output_dir: str) -> list:
    import imageio
    frames_dir = os.path.join(output_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    paths = []
    try:
        reader = imageio.get_reader(video_path)
        meta = reader.get_meta_data()
        fps = meta.get("fps", 30)
        interval = int(fps * 3)
        for i, frame in enumerate(reader):
            if i % interval == 0 and len(paths) < 10:
                path = os.path.join(frames_dir, f"frame{i:04d}.jpg")
                imageio.imwrite(path, frame)
                paths.append(path)
        reader.close()
    except Exception as e:
        raise RuntimeError(f"Frame extraction failed: {str(e)}")
    return paths


def encode_image(path: str) -> str:
    with open(path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def parse_recipe_json(raw: str) -> dict:
    raw = raw.strip()
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("{"):
                raw = part
                break
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON found", raw, 0)
    return json.loads(raw[start:end].strip())


def analyze_frames(frame_paths: list) -> dict:
    image_content = []
    for path in frame_paths:
        image_content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": encode_image(path)},
        })
    image_content.append({
        "type": "text",
        "text": (
            "These are frames from a cooking video. Extract the recipe and return ONLY valid JSON:\n"
            '{"dish":"name","description":"one sentence","prep_time":"e.g. 10 mins",'
            '"cook_time":"e.g. 20 mins","servings":"e.g. 2",'
            '"ingredients":[{"amount":"2","unit":"cups","item":"flour"}],'
            '"steps":["Step 1..."],"tips":["Optional tip"],'
            '"nutrition":{"calories":350,"protein":25,"carbs":30,"fat":12}}'
            "\nNutrition should be estimated per serving. No text outside the JSON."
        ),
    })
    last_error = None
    for attempt in range(3):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                messages=[{"role": "user", "content": image_content}],
            )
            return parse_recipe_json(response.content[0].text)
        except Exception as e:
            last_error = e
            continue
    raise json.JSONDecodeError(f"Failed after 3 attempts: {str(last_error)}", "", 0)


def process_image_data(img_data: str, mime_type: str = "image/jpeg") -> dict:
    if mime_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        mime_type = "image/jpeg"
    if "," in img_data:
        img_data = img_data.split(",")[1]
    if img_data.startswith("iVBOR"):
        mime_type = "image/png"
    elif img_data.startswith("/9j/"):
        mime_type = "image/jpeg"
    return {"type": "image", "source": {"type": "base64", "media_type": mime_type, "data": img_data}}


@app.route("/api/extract", methods=["POST"])
def extract():
    data = request.get_json()
    url = (data or {}).get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            video_path = download_reel(url, tmpdir)
            frame_paths = extract_frames(video_path, tmpdir)
            if not frame_paths:
                return jsonify({"error": "Could not extract frames"}), 500
            recipe = analyze_frames(frame_paths)
            thumbnail = encode_image(frame_paths[0]) if frame_paths else None
            return jsonify({"recipe": recipe, "thumbnail": thumbnail})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 422
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned malformed recipe — try again"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@app.route("/api/extract-photo", methods=["POST"])
def extract_photo():
    data = request.get_json()
    images = (data or {}).get("images", [])
    if not images:
        single = (data or {}).get("image", "").strip()
        single_mime = (data or {}).get("mimeType", "image/jpeg")
        if single:
            images = [{"data": single, "mimeType": single_mime}]
    if not images:
        return jsonify({"error": "No image provided"}), 400
    try:
        image_content = []
        for img in images:
            img_data = img.get("data", "")
            mime_type = img.get("mimeType", "image/jpeg")
            image_content.append(process_image_data(img_data, mime_type))

        image_content.append({
            "type": "text",
            "text": (
                "These are photos of a recipe (possibly multiple pages from a cookbook, "
                "handwritten card, or printed recipe). Extract the complete recipe and "
                "return ONLY valid JSON:\n"
                '{"dish":"name","description":"one sentence","prep_time":"e.g. 10 mins",'
                '"cook_time":"e.g. 20 mins","servings":"e.g. 2",'
                '"ingredients":[{"amount":"2","unit":"cups","item":"flour"}],'
                '"steps":["Step 1..."],"tips":["Optional tip"],'
                '"nutrition":{"calories":350,"protein":25,"carbs":30,"fat":12}}'
                "\nNutrition should be estimated per serving. No text outside the JSON."
            ),
        })

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            timeout=60.0,
            messages=[{"role": "user", "content": image_content}],
        )
        return jsonify({"recipe": parse_recipe_json(response.content[0].text)})
    except json.JSONDecodeError:
        return jsonify({"error": "Could not read recipe — try a clearer photo"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@app.route("/api/suggest-snacks", methods=["POST"])
def suggest_snacks():
    data = request.get_json()
    remaining = (data or {}).get("remaining", {})
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{
            "role": "user",
            "content": (
                f"I have these remaining macros for today:\n"
                f"- Calories: {remaining.get('calories')} kcal\n"
                f"- Protein: {remaining.get('protein')}g\n"
                f"- Carbs: {remaining.get('carbs')}g\n"
                f"- Fat: {remaining.get('fat')}g\n\n"
                "Suggest 4 specific snacks that fit within these remaining macros.\n\n"
                "Return ONLY a JSON array, no text outside it:\n"
                '[{"emoji":"🥜","name":"Greek Yogurt with Almonds","portion":"1 cup yogurt + 1oz almonds","calories":320,"protein":28,"carbs":18,"fat":14}]\n\n'
                "Be practical and realistic. No text outside the JSON array."
            )
        }]
    )
    return jsonify({"text": message.content[0].text})


@app.route("/api/search-food", methods=["POST"])
def search_food():
    data = request.get_json()
    query = (data or {}).get("query", "")
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{
            "role": "user",
            "content": (
                f'Give me nutrition info for: "{query}"\n\n'
                "Return ONLY a JSON array of 1-3 serving size options:\n"
                '[{"name":"Chipotle Chicken Burrito Bowl","serving":"1 bowl (680g)","calories":665,"protein":51,"carbs":60,"fat":23}]\n\n'
                "Be as accurate as possible using known restaurant/food data. No text outside the JSON array."
            )
        }]
    )
    return jsonify({"text": message.content[0].text})


@app.route("/api/generate-recipe", methods=["POST"])
def generate_recipe():
    data = request.get_json()
    idea = (data or {}).get("idea", "")
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{
            "role": "user",
            "content": (
                f"Create a detailed recipe for: {idea}\n\n"
                "Return ONLY valid JSON:\n"
                '{"dish":"name","description":"one sentence","prep_time":"e.g. 10 mins","cook_time":"e.g. 20 mins","servings":"e.g. 2",'
                '"ingredients":[{"amount":"2","unit":"cups","item":"flour"}],'
                '"steps":["Step 1..."],"tips":["Optional tip"],'
                '"nutrition":{"calories":350,"protein":25,"carbs":30,"fat":12}}\n\n'
                "Nutrition should be estimated per serving. No text outside the JSON."
            )
        }]
    )
    return jsonify({"text": message.content[0].text})


@app.route("/api/discover-recipes", methods=["POST"])
def discover_recipes():
    data = request.get_json()
    filter_type = (data or {}).get("filter", None)
    filter_text = f"Focus on {filter_type} recipes." if filter_type else "Mix of different cuisines and meal types."
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2500,
            timeout=20.0,
            messages=[{
                "role": "user",
                "content": (
                    f"Generate 4 inspiring recipe ideas. {filter_text}\n\n"
                    "Return ONLY a JSON array:\n"
                    '[{\n'
                    '  "dish": "Spicy Salmon Rice Bowl",\n'
                    '  "description": "Fresh salmon over jasmine rice with sriracha mayo",\n'
                    '  "prep_time": "10 mins",\n'
                    '  "cook_time": "15 mins",\n'
                    '  "servings": "2",\n'
                    '  "difficulty": "Easy",\n'
                    '  "cuisine": "Japanese",\n'
                    '  "emoji": "🍱",\n'
                    '  "ingredients": [{"amount":"2","unit":"fillets","item":"salmon"},{"amount":"1","unit":"cup","item":"jasmine rice"}],\n'
                    '  "steps": ["Cook rice according to package directions.", "Season salmon and pan sear 4 mins each side.", "Serve salmon over rice with sriracha mayo."],\n'
                    '  "tips": ["Use sushi-grade salmon for best results"],\n'
                    '  "nutrition": {"calories": 520, "protein": 38, "carbs": 45, "fat": 18}\n'
                    '}]\n\n'
                    "No text outside the JSON array."
                )
            }]
        )
        return jsonify({"text": message.content[0].text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)