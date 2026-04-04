"""
QuickBite — Lambda 1: OrderHandler
Runtime: Python 3.12
Trigger: API Gateway HTTP API → POST /order

Flow:
  1. Receives JSON body: { customerName, customerEmail, item }
  2. Validates all fields
  3. Generates orderId (ORD-XXXXXX)
  4. Saves full order object to DynamoDB "Orders" table
  5. Sends order to SQS "OrderQueue" for async processing
  6. Returns HTTP 200 with orderId

IAM Role needed: LambdaOrderHandlerRole
  - AWSLambdaBasicExecutionRole  (CloudWatch Logs)
  - AmazonDynamoDBFullAccess     (PutItem to Orders table)
  - AmazonSQSFullAccess          (SendMessage to OrderQueue)
"""

import json
import uuid
import boto3
from datetime import datetime, timezone

# ═══════════════════════════════════════════════════════════════
#  AWS SDK CLIENTS  (region must match where you created the resources)
# ═══════════════════════════════════════════════════════════════
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
sqs      = boto3.client("sqs",      region_name="ap-south-1")

# ═══════════════════════════════════════════════════════════════
#  ⚠️  PASTE YOUR SQS QUEUE URL HERE
#  How to find it:
#    AWS Console → SQS → click "OrderQueue" → copy the "URL" field
#  It looks like:
#    https://sqs.ap-south-1.amazonaws.com/123456789012/OrderQueue
# ═══════════════════════════════════════════════════════════════
SQS_QUEUE_URL = "PASTE_YOUR_SQS_QUEUE_URL_HERE"

# DynamoDB table name — must match exactly (case-sensitive)
DYNAMODB_TABLE = "Orders"

# CORS headers — included in every response so the browser allows the call
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────
def generate_order_id():
    """Generate a short, unique order ID like ORD-A1B2C3."""
    return f"ORD-{uuid.uuid4().hex[:6].upper()}"


def success_response(body, status=200):
    """Return a well-formed success response with CORS headers."""
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def error_response(status, message):
    """Return a well-formed error response with CORS headers."""
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": message}),
    }


# ─────────────────────────────────────────────────────────────
#  MAIN HANDLER
# ─────────────────────────────────────────────────────────────
def lambda_handler(event, context):
    """Entry point for API Gateway HTTP API proxy event."""
    print("📥 Received event:", json.dumps(event))

    # ── Handle CORS preflight (OPTIONS) ──────────────────────
    # HTTP API uses requestContext.http.method
    # REST API uses httpMethod
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or ""
    )
    if method == "OPTIONS":
        return success_response("")

    # ── Parse request body ───────────────────────────────────
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return error_response(400, "Invalid JSON in request body.")

    customer_name  = body.get("customerName",  "").strip()
    customer_email = body.get("customerEmail", "").strip()
    item           = body.get("item",          "").strip()
    customer_phone = body.get("customerPhone", "").strip()
    delivery_address = body.get("deliveryAddress", {})
    delivery_city  = body.get("deliveryCity", "").strip()
    address        = body.get("address", "").strip()

    # ── Validate required fields ─────────────────────────────
    if not customer_name:
        return error_response(400, "Missing required field: customerName")
    if not customer_email:
        return error_response(400, "Missing required field: customerEmail")
    if not item:
        return error_response(400, "Missing required field: item")
    if "@" not in customer_email or "." not in customer_email:
        return error_response(400, "Invalid email format.")

    # ── Build the order object ───────────────────────────────
    order_id  = generate_order_id()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    order = {
        "orderId":         order_id,
        "customerName":    customer_name,
        "customerEmail":   customer_email,
        "customerPhone":   customer_phone,
        "item":            item,
        "address":         address,
        "deliveryAddress": delivery_address,
        "deliveryCity":    delivery_city,
        "status":          "PLACED",
        "timestamp":       timestamp,
    }

    print(f"📝 Order object: {json.dumps(order)}")

    # ── Step 1: Save to DynamoDB ─────────────────────────────
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(Item=order)
        print(f"✅ DynamoDB: saved {order_id}")
    except Exception as e:
        print(f"❌ DynamoDB error: {e}")
        return error_response(500, "Failed to save order. Please try again.")

    # ── Step 2: Send to SQS ──────────────────────────────────
    try:
        sqs.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps(order),
        )
        print(f"✅ SQS: queued {order_id}")
    except Exception as e:
        print(f"❌ SQS error: {e}")
        return error_response(500, "Order saved but notification failed.")

    # ── Return success ───────────────────────────────────────
    print(f"🎉 Order complete: {order_id}")
    return success_response({
        "message": "Order placed!",
        "orderId": order_id,
    })
