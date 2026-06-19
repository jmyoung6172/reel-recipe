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
    result = subprocess.run(
        ["python", "-m", "yt_dlp", "--no-warnings", "-o", output_path, url],
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
        interval = int(fps * 3)  # one frame every 3 seconds
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
            '"steps":["Step 1..."],"tips":["Optional tip"]}'
            "\nNo text outside the JSON."
        ),
    })
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": image_content}],
    )
    raw = response.content[0].text.strip()
    # Strip markdown fences
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    # Find JSON object within response
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON found", raw, 0)
    raw = raw[start:end]
    return json.loads(raw.strip())


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
    image_data = (data or {}).get("image", "").strip()
    if not image_data:
        return jsonify({"error": "No image provided"}), 400
    try:
        mime_type = (data or {}).get("mimeType", "image/jpeg")
        if mime_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
            mime_type = "image/jpeg"
        if "," in image_data:
            image_data = image_data.split(",")[1]
        # Auto-detect from base64 signature
        if image_data.startswith("iVBOR"):
            mime_type = "image/png"
        elif image_data.startswith("/9j/"):
            mime_type = "image/jpeg"
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "This is a photo of a recipe (handwritten, printed, or from a cookbook). "
                            "Extract the recipe and return ONLY valid JSON:\n"
                            '{"dish":"name","description":"one sentence","prep_time":"e.g. 10 mins",'
                            '"cook_time":"e.g. 20 mins","servings":"e.g. 2",'
                            '"ingredients":[{"amount":"2","unit":"cups","item":"flour"}],'
                            '"steps":["Step 1..."],"tips":["Optional tip"]}'
                            "\nNo text outside the JSON."
                        ),
                    },
                ],
            }],
        )
        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start == -1 or end == 0:
            raise json.JSONDecodeError("No JSON found", raw, 0)
        raw = raw[start:end]
        return jsonify({"recipe": json.loads(raw.strip())})
    except json.JSONDecodeError:
        return jsonify({"error": "Could not read recipe — try a clearer photo"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)