"""
QuickBite — Lambda 3: GetOrders
Runtime: Python 3.12
Trigger: API Gateway HTTP API → GET /orders?email=xxx

Flow:
  1. Reads the 'email' query parameter
  2. Queries DynamoDB 'Orders' table using GSI 'EmailIndex'
  3. Returns a JSON array of past orders, newest first

IAM Role: Reuse LambdaOrderHandlerRole
  - AWSLambdaBasicExecutionRole  (CloudWatch Logs)
  - AmazonDynamoDBFullAccess     (Query on Orders table)

DynamoDB GSI Required:
  Table:          Orders
  Index name:     EmailIndex
  Partition key:  customerEmail (String)
  Sort key:       timestamp (String)
  Projection:     All attributes
"""

import json
import boto3
from boto3.dynamodb.conditions import Key

# ═══════════════════════════════════════════════════════════════
#  AWS SDK CLIENT
# ═══════════════════════════════════════════════════════════════
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")

# DynamoDB table and GSI names
DYNAMODB_TABLE = "Orders"
GSI_NAME = "EmailIndex"

# CORS headers
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
}


def success_response(body, status=200):
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def error_response(status, message):
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": message}),
    }


def lambda_handler(event, context):
    """Entry point for API Gateway HTTP API proxy event."""
    print("📥 GetOrders event:", json.dumps(event))

    # ── Handle CORS preflight ────────────────────────────────
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or ""
    )
    if method == "OPTIONS":
        return success_response("")

    # ── Extract email from query string ──────────────────────
    params = event.get("queryStringParameters") or {}
    email = params.get("email", "").strip()

    if not email:
        return error_response(400, "Missing required query parameter: email")

    if "@" not in email or "." not in email:
        return error_response(400, "Invalid email format.")

    print(f"🔍 Querying orders for: {email}")

    # ── Query DynamoDB GSI ───────────────────────────────────
    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        response = table.query(
            IndexName=GSI_NAME,
            KeyConditionExpression=Key("customerEmail").eq(email),
            ScanIndexForward=False,  # newest first (descending timestamp)
        )

        orders = response.get("Items", [])
        print(f"✅ Found {len(orders)} order(s) for {email}")

        # Convert Decimal types to float/int for JSON serialization
        cleaned_orders = []
        for order in orders:
            cleaned = {}
            for k, v in order.items():
                if hasattr(v, "is_integer"):  # Decimal type
                    cleaned[k] = int(v) if v == int(v) else float(v)
                else:
                    cleaned[k] = v
            cleaned_orders.append(cleaned)

        return success_response({
            "email": email,
            "count": len(cleaned_orders),
            "orders": cleaned_orders,
        })

    except Exception as e:
        print(f"❌ DynamoDB query error: {e}")
        return error_response(500, "Failed to retrieve orders.")
