#!/bin/bash
# Rhythm Backend — One-command deploy
# Usage: ./deploy.sh YOUR_AWS_ACCOUNT_ID
# Requires: AWS CLI configured with admin credentials

set -e

ACCOUNT_ID=${1:?Usage: ./deploy.sh YOUR_AWS_ACCOUNT_ID}
REGION="us-east-1"
BUCKET="rhythm-captures-${ACCOUNT_ID}"
FUNCTION="rhythm-verify"
ROLE="rhythm-lambda-role"
API_NAME="rhythm-api"

echo "🚀 Deploying Rhythm backend to AWS..."

# ── S3 bucket ──
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET --region $REGION 2>/dev/null || echo "  (bucket already exists)"
aws s3api put-bucket-lifecycle-configuration \
  --bucket $BUCKET \
  --lifecycle-configuration '{"Rules":[{"ID":"expire-videos","Status":"Enabled","Expiration":{"Days":90},"Filter":{"Prefix":"captures/"}}]}' 2>/dev/null || true

# ── IAM role ──
echo "🔐 Creating IAM role..."
aws iam create-role \
  --role-name $ROLE \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  2>/dev/null || echo "  (role already exists)"

aws iam attach-role-policy \
  --role-name $ROLE \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  2>/dev/null || true

aws iam put-role-policy \
  --role-name $ROLE \
  --policy-name rhythm-permissions \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Effect\": \"Allow\",
        \"Action\": [\"bedrock:InvokeModel\", \"bedrock:Converse\"],
        \"Resource\": \"arn:aws:bedrock:${REGION}::foundation-model/amazon.nova-2-lite-v1:0\"
      },
      {
        \"Effect\": \"Allow\",
        \"Action\": [\"s3:PutObject\", \"s3:GetObject\"],
        \"Resource\": \"arn:aws:s3:::${BUCKET}/*\"
      }
    ]
  }"

echo "  Waiting for role to propagate..."
sleep 10

# ── Lambda ──
echo "⚡ Packaging and deploying Lambda..."
cd lambda
zip -q verify.zip verify.py
cd ..

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE}"

aws lambda create-function \
  --function-name $FUNCTION \
  --runtime python3.12 \
  --architectures arm64 \
  --handler verify.handler \
  --role $ROLE_ARN \
  --zip-file fileb://lambda/verify.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment "Variables={VIDEO_BUCKET=${BUCKET},AWS_REGION=${REGION}}" \
  --region $REGION \
  2>/dev/null || \
aws lambda update-function-code \
  --function-name $FUNCTION \
  --zip-file fileb://lambda/verify.zip \
  --region $REGION

aws lambda wait function-updated --function-name $FUNCTION --region $REGION

# ── API Gateway ──
echo "🌐 Creating API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
  --name $API_NAME \
  --protocol-type HTTP \
  --cors-configuration "AllowOrigins=*,AllowMethods=POST OPTIONS,AllowHeaders=Content-Type" \
  --region $REGION \
  --query 'ApiId' --output text 2>/dev/null || \
  aws apigatewayv2 get-apis --region $REGION \
    --query "Items[?Name=='${API_NAME}'].ApiId" --output text)

LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION}"

INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri $LAMBDA_ARN \
  --payload-format-version 2.0 \
  --region $REGION \
  --query 'IntegrationId' --output text)

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /verify" \
  --target "integrations/${INTEGRATION_ID}" \
  --region $REGION 2>/dev/null || true

aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name '$default' \
  --auto-deploy \
  --region $REGION 2>/dev/null || true

aws lambda add-permission \
  --function-name $FUNCTION \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*/verify" \
  --region $REGION 2>/dev/null || true

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/verify"

# ── Done ──
echo ""
echo "✅ Deployed successfully!"
echo ""
echo "API endpoint: $API_URL"
echo ""
echo "Set this in RhythmApp/src/services/verification.ts:"
echo "  const API_ENDPOINT = '${API_URL}';"
