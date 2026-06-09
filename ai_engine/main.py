from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
from services.embedding_services import embedding_service
import os
from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
app = FastAPI(title="Neural Ops AI Engine")
DATABASE_URL = os.getenv("DATABASE_URL")

class SearchQuery(BaseModel):
    serviceId:str
    query_text:str
    limit:int=5
    
@app.post("/api/v1/search")
def semantic_search(payload: SearchQuery):
    try:
        # 1. Convert human search string into a vector
        search_vector = embedding_service.generate_embedding(payload.query_text)
        vector_str = f"[{','.join(map(str, search_vector))}]"

        # 2. Query Postgres using Cosine Distance (<=> operator)
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # The <=> operator calculates cosine distance. 
        # Smaller distance means higher similarity.
        search_query = """
            SELECT id, level, message, metadata, timestamp,
                   (1 - (embedding <=> %s::vector)) AS similarity
            FROM "Log"
            WHERE "serviceId" = %s
            ORDER BY embedding <=> %s::vector ASC
            LIMIT %s;
        """
        
        cursor.execute(search_query, (vector_str, payload.serviceId, vector_str, payload.limit))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                "id": row[0],
                "level": row[1],
                "message": row[2],
                "metadata": row[3],
                "timestamp": row[4].isoformat(),
                "similarityScore": round(row[5], 4)
            })
            
        cursor.close()
        conn.close()
        return {"success": True, "results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    