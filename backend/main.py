from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from openai import OpenAI

app = FastAPI()

# Replace "api_key" with anthropic api key 
client = OpenAI(
    api_key="<your anthropic api key here>",
    base_url="https://api.anthropic.com/v1/"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("../dummyData.json", "r") as f:
    DUMMY_DATA = json.load(f)

@app.get("/api/data")
def get_data():
    """
    Returns dummy data (e.g., list of users).
    """
    return DUMMY_DATA

@app.get("/api/sales-reps")
def get_sales_reps():
    """
    Returns sales representatives data from dummyData.json.
    """
    return {"salesReps": DUMMY_DATA.get("salesReps", [])}

@app.post("/api/ai")
async def ai_endpoint(request: Request):
    """
    Accepts a user question, analyzes the sales data from dummyData.json,
    and sends the question along with the data context to OpenAI API for processing.
    Returns the AI-generated response based on the actual sales data.
    """
    try:
        body = await request.json()
        user_question = body.get("question", "")
        
        if not user_question:
            return {"answer": "Please provide a question in your request."}
        
        sales_reps = DUMMY_DATA.get("salesReps", [])
        
        total_reps = len(sales_reps)
        regions = list(set(rep["region"] for rep in sales_reps))
        
        all_deals = []
        for rep in sales_reps:
            all_deals.extend(rep["deals"])
        
        total_deals = len(all_deals)
        total_value = sum(deal["value"] for deal in all_deals)
        won_deals = sum(1 for deal in all_deals if deal["status"] == "Closed Won")
        lost_deals = sum(1 for deal in all_deals if deal["status"] == "Closed Lost")
        in_progress_deals = sum(1 for deal in all_deals if deal["status"] == "In Progress")
        
        rep_performances = []
        for rep in sales_reps:
            won_value = sum(deal["value"] for deal in rep["deals"] if deal["status"] == "Closed Won")
            rep_performances.append({"name": rep["name"], "won_value": won_value})
        
        top_performer = max(rep_performances, key=lambda x: x["won_value"])
        
        data_context = f"""
Sales Team Overview:
- Total Sales Representatives: {total_reps}
- Regions Covered: {', '.join(regions)}
- Total Deals: {total_deals} (Won: {won_deals}, Lost: {lost_deals}, In Progress: {in_progress_deals})
- Total Deal Value: ${total_value:,}
- Top Performer: {top_performer['name']} (${top_performer['won_value']:,} in closed deals)

Detailed Sales Representatives Data:
{json.dumps(sales_reps, indent=2)}

Please analyze this sales data to answer the following question: {user_question}
"""
        
        try:
            response = client.chat.completions.create(
                model="claude-3-7-sonnet-20250219", # Anthropic model name
                messages=[
                    {"role": "system", "content": "You are a sales analytics assistant with access to the company's sales data. Analyze the provided data to give accurate, data-driven responses. When appropriate, include specific numbers, trends, and insights from the data."},
                    {"role": "user", "content": data_context}
                ],
            )
            
            answer = response.choices[0].message.content.strip()
            return {"answer": answer}
        except Exception as openai_error:
            print(f"OpenAI API Error: {str(openai_error)}")
            print(f"Error type: {type(openai_error).__name__}")
            return {"answer": f"Error communicating with OpenAI API: {str(openai_error)}"}
            
    except json.JSONDecodeError as json_error:
        print(f"JSON Decode Error: {str(json_error)}")
        return {"answer": "Invalid JSON in request body"}
    except Exception as e:
        print(f"General Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return {"answer": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
