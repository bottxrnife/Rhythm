"""
Rhythm Local Verification Server — Nova 2 Lite via Bedrock Converse API

Runs on your Mac. The phone app sends video to this server, which calls
Amazon Nova 2 Lite to analyze whether the routine was actually completed.

Usage:
  # Load credentials from backend/.env automatically:
  python3 backend/local_server.py

  # Or pass credentials directly:
  AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx python3 backend/local_server.py

The server runs on port 3001.
"""

import json
import time
import hashlib
import base64
import os
import re
from http.server import HTTPServer, BaseHTTPRequestHandler

# Load .env file if it exists
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

import boto3

MODEL_ID = 'us.amazon.nova-2-lite-v1:0'
REGION = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
PORT = 3001

bedrock = boto3.client('bedrock-runtime', region_name=REGION)

VERIFICATION_SCHEMA = {
    "type": "object",
    "properties": {
        "verified": {"type": "boolean"},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "product_visible": {"type": "boolean"},
        "product_in_use": {"type": "boolean"},
        "routine_completed": {"type": "boolean"},
        "appears_genuine": {"type": "boolean"},
        "reason": {"type": "string"}
    },
    "required": ["verified", "confidence", "product_visible", "product_in_use",
                  "routine_completed", "appears_genuine", "reason"]
}


def compress_video(video_bytes, max_size_mb=15):
    """Compress video using ffmpeg if it exceeds max size."""
    import subprocess, tempfile, os

    if len(video_bytes) <= max_size_mb * 1024 * 1024:
        return video_bytes

    original_mb = len(video_bytes) / 1024 / 1024
    print(f'  Compressing video ({original_mb:.1f}MB > {max_size_mb}MB limit)...')

    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as inp:
        inp.write(video_bytes)
        input_path = inp.name

    output_path = input_path + '.compressed.mp4'

    try:
        result = subprocess.run([
            'ffmpeg', '-y', '-i', input_path,
            '-vf', 'scale=-2:480',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '28',
            '-an',
            '-t', '12',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            output_path,
        ], capture_output=True, timeout=30)

        if result.returncode != 0:
            print(f'  ffmpeg error: {result.stderr.decode()[-200:]}')
            return video_bytes

        with open(output_path, 'rb') as f:
            compressed = f.read()

        print(f'  Compressed: {original_mb:.1f}MB -> {len(compressed) / 1024 / 1024:.1f}MB')
        return compressed
    except Exception as e:
        print(f'  Compression failed: {e}, using original')
        return video_bytes
    finally:
        for p in [input_path, output_path]:
            try:
                os.unlink(p)
            except:
                pass


def verify_with_nova(routine_id, sponsor, video_b64, location):
    """Call Amazon Nova 2 Lite via Bedrock Converse API for video verification."""
    content = []

    if video_b64:
        video_bytes = base64.b64decode(video_b64)
        video_bytes = compress_video(video_bytes)
        content.append({
            'video': {
                'format': 'mp4',
                'source': {'bytes': video_bytes},
            },
        })

    sponsor_check = ''
    if sponsor and sponsor.lower() not in ('none', 'unknown', 'rhythm', ''):
        sponsor_check = (
            f'1. Is the {sponsor} product clearly visible with its label readable?\n'
            f'2. Is the product being actively used on camera — opened, squeezed, poured, '
            f'consumed, or applied — not just sitting on a surface?\n'
        )
    else:
        sponsor_check = (
            f'1. (No sponsor product required — skip product checks, set product_visible and product_in_use to true)\n'
            f'2. (No sponsor product required)\n'
        )

    content.append({
        'text': (
            f'You are a verification agent for a daily routine app called Rhythm. '
            f'You are given a short video clip of a person performing a daily routine. '
            f'Examine the video carefully. Do not make up information not present in the video.\n\n'
            f'ROUTINE: {routine_id}\n'
            f'EXPECTED SPONSOR PRODUCT: {sponsor if sponsor.lower() not in ("none", "unknown", "rhythm", "") else "none (unsponsored routine)"}\n'
            f'LOCATION: {location or "not provided"}\n\n'
            f'Determine the following from the video:\n'
            f'{sponsor_check}'
            f'3. Is the routine ({routine_id}) performed from start to finish?\n'
            f'4. Does this appear to be a genuine, real-time capture — not a replay of '
            f'a screen, a photo of a photo, or a pre-recorded clip?\n\n'
            f'Return ONLY valid JSON matching this schema (no markdown, no explanation):\n'
            f'{json.dumps(VERIFICATION_SCHEMA, indent=2)}'
        ),
    })

    # Call Nova with retry on transient errors
    last_error = None
    for attempt in range(2):
        try:
            response = bedrock.converse(
                modelId=MODEL_ID,
                messages=[{'role': 'user', 'content': content}],
                inferenceConfig={'maxTokens': 400, 'temperature': 0},
            )
            output_text = response['output']['message']['content'][0]['text']
            break
        except Exception as e:
            last_error = e
            if attempt == 0 and 'Malformed' in str(e):
                print(f'  Retrying after malformed input error...')
                # Try without video on retry
                content = [c for c in content if 'video' not in c]
                content.insert(0, {'text': '[Video could not be processed. Analyze based on the routine description only. Set verified to false.]'})
                continue
            raise
    else:
        raise last_error

    # Parse JSON from response
    try:
        return json.loads(output_text)
    except json.JSONDecodeError:
        m = re.search(r'\{.*\}', output_text, re.DOTALL)
        if m:
            return json.loads(m.group())
        return {
            'verified': False, 'confidence': 0.0,
            'product_visible': False, 'product_in_use': False,
            'routine_completed': False, 'appears_genuine': False,
            'reason': f'Could not parse model response: {output_text[:200]}',
        }


class VerifyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path != '/verify':
            self.send_json(404, {'error': 'Not found'})
            return

        start = time.time()

        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length > 0 else {}

            routine_id = body.get('routine_id', 'unknown')
            sponsor = body.get('sponsor', 'unknown')
            wallet = body.get('wallet')
            location = body.get('location')
            timestamp = body.get('timestamp', int(time.time() * 1000))
            video_b64 = body.get('video_b64')

            if not routine_id or not sponsor:
                self.send_json(400, {'error': 'Missing routine_id or sponsor'})
                return

            bundle_hash = hashlib.sha256(
                f'{routine_id}:{sponsor}:{wallet}:{timestamp}'.encode()
            ).hexdigest()[:16]

            video_size = len(base64.b64decode(video_b64)) if video_b64 else 0
            print(f'  Routine: {routine_id} | Sponsor: {sponsor} | Video: {video_size:,} bytes')
            print(f'  Calling Nova 2 Lite...')

            judgment = verify_with_nova(routine_id, sponsor, video_b64, location)

            # Policy check
            issues = []
            is_sponsored = sponsor.lower() not in ('none', 'unknown', 'rhythm', '')

            if judgment.get('confidence', 0) < 0.70:
                issues.append(f"Confidence {judgment.get('confidence', 0):.2f} below 0.70")
            if is_sponsored and not judgment.get('product_visible'):
                issues.append('Sponsor product not visible')
            if is_sponsored and not judgment.get('product_in_use'):
                issues.append('Product not actively used')
            if not judgment.get('routine_completed'):
                issues.append('Routine not completed')
            if not judgment.get('appears_genuine'):
                issues.append('Capture does not appear genuine')

            med_routines = ['take-statin', 'take-metformin', 'take-bp-med',
                            'use-inhaler', 'glucose-check', 'apply-topical']
            if routine_id in med_routines and not location:
                issues.append('Medication routines require location')

            policy_passed = len(issues) == 0 and judgment.get('verified', False)
            payment_id = f'x402_{bundle_hash}_{int(time.time())}' if policy_passed else None

            elapsed = int((time.time() - start) * 1000)
            status = '\u2713 VERIFIED' if policy_passed else '\u2717 NOT VERIFIED'
            print(f'  {status} (confidence: {judgment.get("confidence", 0):.2f}, {elapsed}ms)')
            if judgment.get('reason'):
                print(f'  Reason: {judgment["reason"][:120]}')
            if issues:
                print(f'  Issues: {", ".join(issues)}')

            self.send_json(200, {
                'verified': policy_passed,
                'confidence': judgment.get('confidence', 0.0),
                'reason': judgment.get('reason', ''),
                'product_visible': judgment.get('product_visible', False),
                'product_in_use': judgment.get('product_in_use', False),
                'routine_completed': judgment.get('routine_completed', False),
                'appears_genuine': judgment.get('appears_genuine', False),
                'model': MODEL_ID,
                'processing_time_ms': elapsed,
                'policy_passed': policy_passed,
                'policy_issues': issues,
                'x402_payment_id': payment_id,
                'bundle_hash': bundle_hash,
                'agents': ['capture', 'verification', 'policy', 'payout'],
            })

        except Exception as e:
            print(f'  ERROR: {e}')
            self.send_json(500, {'error': str(e), 'verified': False})

    def send_json(self, status, body):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def log_message(self, format, *args):
        print(f'[{time.strftime("%H:%M:%S")}] {args[0]}')


if __name__ == '__main__':
    print()
    print('Rhythm Verification Server')
    print(f'  Model:  {MODEL_ID}')
    print(f'  Region: {REGION}')
    print(f'  Port:   {PORT}')
    print()

    # Quick test that credentials work
    try:
        test = bedrock.converse(
            modelId=MODEL_ID,
            messages=[{'role': 'user', 'content': [{'text': 'Hi'}]}],
            inferenceConfig={'maxTokens': 5, 'temperature': 0},
        )
        print('  Nova 2 Lite: connected')
    except Exception as e:
        print(f'  WARNING: Nova 2 Lite test failed: {e}')

    print()
    print(f'  Listening on http://0.0.0.0:{PORT}/verify')
    print()

    server = HTTPServer(('0.0.0.0', PORT), VerifyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        server.server_close()
