import json
import boto3
import uuid
import os

stepfunctions = boto3.client('stepfunctions')

def lambda_handler(event, context):
    try:
        print("Received Event:", json.dumps(event))
        
        # 1. Parse incoming data
        body = json.loads(event.get('body', '{}'))
        cart = body.get('cart', [])
        
        # In a real API Gateway with Cognito Authorizer, we get the email from claims:
        # user_email = event['requestContext']['authorizer']['claims']['email']
        user_email = body.get('email', 'guest@example.com')
        
        # 2. Basic Validation
        if not cart or len(cart) == 0:
            return {"statusCode": 400, "body": json.dumps("Cart is empty")}
            
        order_id = str(uuid.uuid4())
        
        # 3. Start Step Functions Workflow
        # The ARN should be passed as an Environment Variable in AWS Lambda config
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN', 'arn:aws:states:REGION:ACCOUNT:stateMachine:QuickBiteWorkflow')
        
        # Calculate total
        total_amount = sum([item['price'] * item['qty'] for item in cart])
        
        workflow_input = {
            "orderId": order_id,
            "userEmail": user_email,
            "cart": cart,
            "totalAmount": total_amount
        }
        
        # Call Step Functions
        response = stepfunctions.start_execution(
            stateMachineArn=state_machine_arn,
            name=order_id, # Must be unique
            input=json.dumps(workflow_input)
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "message": "Order placed successfully! Workflow started.", 
                "orderId": order_id,
                "executionArn": response['executionArn']
            })
        }
        
    except Exception as e:
        print(f"Error starting workflow: {str(e)}")
        return {
            "statusCode": 500, 
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }
