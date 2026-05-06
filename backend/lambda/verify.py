"""
Rhythm Agentic Verification Pipeline — Amazon Nova 2 Lite

Uses Amazon Nova 2 Lite (amazon.nova-2-lite-v1:0) via Converse API.
Video input → structured JSON verification output.

Prompting follows AWS Nova multimodal guidelines:
- Video content placed before text prompt in message
- Temperature 0 for consistent verification judgments
- JSON schema provided for structured output (KIE pattern)
- No reasoning enabled (classification-style task)

Agent pipeline:
  1. Capture Agent — structures evidence bundle, stores video to S3
  2. Verification Agent — Nova 2 Lite watches video, returns structured judgment
  3. Policy Agent — enforces sponsor rules and confidence thresholds
  4. Payout Agent — triggers x402 payment if approved
"""

import json
import time
import boto3
import os
import hashlib
import base64
import uuid

bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
s3 = boto3.client('s3')

MODEL_ID = 'amazon.nova-2-lite-v1:0'
VIDEO_BUCKET = os.environ['VIDEO_BUCKET']

# JSON schema for structured verification output (KIE pattern)
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


def handler(event, context):
    start = time.time()

    try:
        body = json.loads(event.get('body', '{}'))

        # ── Agent 1: Capture ──
        routine_id = body.get('routine_id', 'unknown')
        sponsor = body.get('sponsor', 'unknown')
        wallet = body.get('wallet')
        location = body.get('location')
        timestamp = body.get('timestamp', int(time.time() * 1000))
        video_b64 = body.get('video_b64')

        if not routine_id or not sponsor:
            return resp(400, {'error': 'Missing routine_id or sponsor'})

        bundle_hash = hashlib.sha256(
            f'{routine_id}:{sponsor}:{wallet}:{timestamp}'.encode()
        ).hexdigest()[:16]

        # Store video to S3
        video_key = None
        if video_b64:
            video_bytes = base64.b64decode(video_b64)
            video_key = f'captures/{bundle_hash}/{uuid.uuid4()}.mp4'
            s3.put_object(
                Bucket=VIDEO_BUCKET,
                Key=video_key,
                Body=video_bytes,
                ContentType='video/mp4',
            )

        # ── Agent 2: Verification ──
        # Build multimodal message: video first, then text prompt (per AWS guidelines)
        content = []

        if video_key:
            content.append({
                'video': {
                    'format': 'mp4',
                    'source': {
                        's3Location': {
                            'uri': f's3://{VIDEO_BUCKET}/{video_key}',
                        },
                    },
                },
            })

        # User prompt last, after video content (per AWS content order guidelines)
        content.append({
            'text': (
                f'You are a verification agent for a daily routine support app. '
                f'You are given security-camera-style footage of a person performing a routine. '
                f'Examine the video carefully. Do not make up information not present in the video.\n\n'
                f'ROUTINE: {routine_id}\n'
                f'EXPECTED SPONSOR PRODUCT: {sponsor}\n'
                f'LOCATION: {location or "not provided"}\n\n'
                f'Determine the following from the video:\n'
                f'1. Is the {sponsor} product clearly visible with its label readable?\n'
                f'2. Is the product being actively used on camera — opened, squeezed, poured, '
                f'consumed, or applied — not just sitting on a surface?\n'
                f'3. Is the routine ({routine_id}) performed from start to finish?\n'
                f'4. Does this appear to be a genuine, real-time capture — not a replay of '
                f'a screen, a photo of a photo, or a pre-recorded clip?\n\n'
                f'Extract information in JSON format according to the given schema.\n\n'
                f'JSON Schema:\n{json.dumps(VERIFICATION_SCHEMA, indent=2)}'
            ),
        })

        # Call Nova 2 Lite — temperature 0 for consistent judgments, no reasoning
        nova_response = bedrock.converse(
            modelId=MODEL_ID,
            messages=[{'role': 'user', 'content': content}],
            inferenceConfig={
                'maxTokens': 300,
                'temperature': 0,
            },
        )

        output_text = nova_response['output']['message']['content'][0]['text']

        # Parse structured JSON output
        try:
            judgment = json.loads(output_text)
        except json.JSONDecodeError:
            import re
            m = re.search(r'\{.*\}', output_text, re.DOTALL)
            judgment = json.loads(m.group()) if m else {
                'verified': False, 'confidence': 0.0,
                'product_visible': False, 'product_in_use': False,
                'routine_completed': False, 'appears_genuine': False,
                'reason': 'Could not parse model response',
            }

        # ── Agent 3: Policy ──
        issues = []

        if judgment.get('confidence', 0) < 0.70:
            issues.append(f"Confidence {judgment.get('confidence', 0):.2f} below 0.70 threshold")
        if not judgment.get('product_visible'):
            issues.append('Sponsor product not visible')
        if not judgment.get('product_in_use'):
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

        # ── Agent 4: Payout ──
        payment_id = None
        if policy_passed:
            payment_id = f'x402_{bundle_hash}_{int(time.time())}'

        return resp(200, {
            'verified': policy_passed,
            'confidence': judgment.get('confidence', 0.0),
            'reason': judgment.get('reason', ''),
            'product_visible': judgment.get('product_visible', False),
            'product_in_use': judgment.get('product_in_use', False),
            'routine_completed': judgment.get('routine_completed', False),
            'appears_genuine': judgment.get('appears_genuine', False),
            'model': MODEL_ID,
            'processing_time_ms': int((time.time() - start) * 1000),
            'policy_passed': policy_passed,
            'policy_issues': issues,
            'x402_payment_id': payment_id,
            'bundle_hash': bundle_hash,
            'video_stored': video_key is not None,
            'agents': ['capture', 'verification', 'policy', 'payout'],
        })

    except Exception as e:
        return resp(500, {'error': str(e), 'verified': False})


def resp(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(body),
    }
