"""
QuickBite — Lambda 2: OrderProcessor
Runtime: Python 3.12
Trigger: SQS event source mapping (OrderQueue)

Flow:
  1. Receives a batch of SQS messages from OrderQueue
  2. Parses each message body as an order JSON object
  3. Sends a styled HTML receipt email to the CUSTOMER via SES
  4. Notifies the OWNER via SNS (so you know someone ordered!)

IAM Role needed: LambdaOrderProcessorRole
  - AWSLambdaBasicExecutionRole  (CloudWatch Logs)
  - AmazonSQSFullAccess          (receive/delete messages from OrderQueue)
  - AmazonSESFullAccess          (send receipt emails to customers)
  - AmazonSNSFullAccess          (notify owner of new orders)
"""

import json
import boto3

# ═══════════════════════════════════════════════════════════════
#  AWS SDK CLIENTS
# ═══════════════════════════════════════════════════════════════
ses = boto3.client("ses", region_name="ap-south-1")
sns = boto3.client("sns", region_name="ap-south-1")

# ═══════════════════════════════════════════════════════════════
#  ⚠️  PASTE YOUR VERIFIED SENDER EMAIL HERE
#  How to verify:
#    AWS Console → SES → Verified Identities → Create Identity
#    → Select "Email address" → enter your email → click link
#
#  ⚠️  SES SANDBOX MODE:
#    By default you can ONLY send to verified email addresses.
#    Request Production Access in SES console to send to anyone.
# ═══════════════════════════════════════════════════════════════
SENDER_EMAIL = "PASTE_YOUR_VERIFIED_SES_EMAIL_HERE"

# ═══════════════════════════════════════════════════════════════
#  ⚠️  PASTE YOUR SNS TOPIC ARN HERE (for owner notifications)
#  AWS Console → SNS → Topics → OrderNotifications → copy ARN
# ═══════════════════════════════════════════════════════════════
SNS_TOPIC_ARN = "PASTE_YOUR_SNS_TOPIC_ARN_HERE"


def build_receipt_html(customer_name, customer_email, order_id, item, status, timestamp):
    """Build a professional restaurant receipt email."""
    # Format the date nicely
    date_display = timestamp.replace("T", " at ").replace("Z", " UTC") if timestamp != "N/A" else timestamp

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
        <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- ═══ Brand Header ═══ -->
                <tr>
                    <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:28px 40px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                            🍔 QuickBite
                        </h1>
                        <p style="margin:6px 0 0;color:rgba(255,255,255,0.88);font-size:13px;font-weight:500;letter-spacing:0.5px;">
                            ORDER RECEIPT
                        </p>
                    </td>
                </tr>

                <!-- ═══ Greeting ═══ -->
                <tr>
                    <td style="padding:32px 40px 0;">
                        <p style="margin:0 0 4px;color:#18181b;font-size:18px;font-weight:700;">
                            Thanks for your order, {customer_name}!
                        </p>
                        <p style="margin:0;color:#71717a;font-size:14px;line-height:1.5;">
                            Your order has been confirmed and is being prepared. Here's your receipt:
                        </p>
                    </td>
                </tr>

                <!-- ═══ Order ID Badge ═══ -->
                <tr>
                    <td style="padding:24px 40px 0;">
                        <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;width:100%;">
                            <tr>
                                <td style="padding:12px 16px;">
                                    <table width="100%">
                                        <tr>
                                            <td style="color:#15803d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Order ID</td>
                                            <td style="text-align:right;color:#15803d;font-size:16px;font-weight:800;font-family:'Courier New',monospace;">{order_id}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- ═══ Receipt Line Items ═══ -->
                <tr>
                    <td style="padding:24px 40px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px dashed #e4e4e7;">

                            <!-- Header Row -->
                            <tr>
                                <td style="padding:14px 0 10px;color:#a1a1aa;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #f4f4f5;">ITEM</td>
                                <td style="padding:14px 0 10px;color:#a1a1aa;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #f4f4f5;text-align:center;">QTY</td>
                                <td style="padding:14px 0 10px;color:#a1a1aa;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #f4f4f5;text-align:right;">STATUS</td>
                            </tr>

                            <!-- Item Row -->
                            <tr>
                                <td style="padding:14px 0;color:#18181b;font-size:15px;font-weight:600;">{item}</td>
                                <td style="padding:14px 0;color:#18181b;font-size:15px;text-align:center;">1</td>
                                <td style="padding:14px 0;text-align:right;">
                                    <span style="background:#f0fdf4;color:#15803d;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;border:1px solid #bbf7d0;">
                                        ✅ {status}
                                    </span>
                                </td>
                            </tr>

                            <!-- Separator -->
                            <tr>
                                <td colspan="3" style="border-top:2px dashed #e4e4e7;padding:0;"></td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- ═══ Details ═══ -->
                <tr>
                    <td style="padding:20px 40px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:6px 0;color:#71717a;font-size:13px;">Customer</td>
                                <td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:500;text-align:right;">{customer_name}</td>
                            </tr>
                            <tr>
                                <td style="padding:6px 0;color:#71717a;font-size:13px;">Email</td>
                                <td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:500;text-align:right;">{customer_email}</td>
                            </tr>
                            <tr>
                                <td style="padding:6px 0;color:#71717a;font-size:13px;">Date</td>
                                <td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:500;text-align:right;">{date_display}</td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- ═══ Thank You ═══ -->
                <tr>
                    <td style="padding:28px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
                            <tr>
                                <td style="padding:16px;text-align:center;">
                                    <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">
                                        🍳 Your <strong>{item}</strong> is being freshly prepared!
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- ═══ Footer ═══ -->
                <tr>
                    <td style="background:#fafafa;padding:20px 40px;border-top:1px solid #f4f4f5;text-align:center;">
                        <p style="margin:0 0 4px;color:#a1a1aa;font-size:11px;">
                            Powered by <strong style="color:#71717a;">AWS Serverless</strong> ☁️
                        </p>
                        <p style="margin:0;color:#d4d4d8;font-size:10px;">
                            QuickBite • Lambda • DynamoDB • SQS • SES • SNS
                        </p>
                    </td>
                </tr>

            </table>
        </td></tr>
    </table>
</body>
</html>"""


def lambda_handler(event, context):
    """
    Entry point.
    SQS sends an event with a 'Records' list. Each record's 'body'
    is a JSON string containing the order placed by OrderHandler.
    """
    print(f"📥 Received {len(event['Records'])} SQS message(s)")

    for record in event["Records"]:
        # ── Parse order from SQS message ─────────────────────
        try:
            order = json.loads(record["body"])
        except (json.JSONDecodeError, KeyError) as e:
            print(f"❌ Bad message, skipping: {e}")
            continue

        order_id       = order.get("orderId",       "UNKNOWN")
        customer_name  = order.get("customerName",   "Customer")
        customer_email = order.get("customerEmail",  "")
        item           = order.get("item",           "N/A")
        status         = order.get("status",         "PLACED")
        timestamp      = order.get("timestamp",      "N/A")

        print(f"📦 Processing order {order_id} for {customer_name} ({customer_email})")

        # ══════════════════════════════════════════════════════
        #  STEP 1: Send receipt email to CUSTOMER via SES
        # ══════════════════════════════════════════════════════
        if customer_email:
            subject = f"Order Confirmed: {order_id} — QuickBite 🍔"
            html_body = build_receipt_html(
                customer_name, customer_email, order_id, item, status, timestamp
            )
            text_body = (
                f"Hi {customer_name}!\n\n"
                f"Your QuickBite order has been confirmed!\n\n"
                f"Order ID  : {order_id}\n"
                f"Item      : {item}\n"
                f"Status    : {status}\n"
                f"Placed at : {timestamp}\n\n"
                f"We're preparing your {item} right now!\n"
                f"Thank you for ordering with QuickBite.\n"
            )

            try:
                resp = ses.send_email(
                    Source=f"QuickBite <{SENDER_EMAIL}>",
                    Destination={"ToAddresses": [customer_email]},
                    Message={
                        "Subject": {"Data": subject, "Charset": "UTF-8"},
                        "Body": {
                            "Text": {"Data": text_body, "Charset": "UTF-8"},
                            "Html": {"Data": html_body, "Charset": "UTF-8"},
                        },
                    },
                )
                print(f"✅ SES receipt sent to {customer_email} (MessageId: {resp.get('MessageId')})")
            except Exception as e:
                print(f"❌ SES error for {order_id} → {customer_email}: {e}")
                raise  # SQS will retry
        else:
            print(f"⚠️ No customer email for {order_id}, skipping SES")

        # ══════════════════════════════════════════════════════
        #  STEP 2: Notify OWNER via SNS (so you know who ordered)
        # ══════════════════════════════════════════════════════
        owner_msg = (
            f"🍔 NEW ORDER RECEIVED!\n\n"
            f"Order ID  : {order_id}\n"
            f"Customer  : {customer_name}\n"
            f"Email     : {customer_email}\n"
            f"Item      : {item}\n"
            f"Time      : {timestamp}\n"
        )

        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"🍔 New Order: {order_id} — {item}",
                Message=owner_msg,
            )
            print(f"✅ SNS owner notification sent for {order_id}")
        except Exception as e:
            # Don't raise here — owner notification is not critical
            # The customer already got their receipt
            print(f"⚠️ SNS notify failed (non-critical): {e}")

    print("✅ All messages processed")
    return {"statusCode": 200, "body": json.dumps({"message": "Done"})}
