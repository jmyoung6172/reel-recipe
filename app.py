import os
import base64
import subprocess
import tempfile
import json
import glob
from flask import Flask, request, jsonify, send_from_directory
import anthropic

app = Flask(__name__, static_folder="static")
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def download_reel(url: str, output_dir: str) -> str:
    output_path = os.path.join(output_dir, "reel.mp4")
    result = subprocess.run(
        ["yt-dlp", "--no-warnings", "-o", output_path, url],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {result.stderr}")
    return output_path


def extract_frames(video_path: str, output_dir: str) -> list:
    frames_dir = os.path.join(output_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-i", video_path, "-vf", "fps=0.3", "-vframes", "12", "-q:v", "3",
         os.path.join(frames_dir, "frame%03d.jpg")],
        capture_output=True, check=True, timeout=30,
    )
    return sorted(glob.glob(os.path.join(frames_dir, "*.jpg")))


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
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
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
            return jsonify({"recipe": recipe})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 422
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned malformed recipe — try again"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)