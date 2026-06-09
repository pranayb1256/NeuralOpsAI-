import os
import json
import redis 
from dotenv import load_dotenv
from services.embedding_services import embedding_service
import psycopg2
load_dotenv(override=True)
REDIS_URL=os.getenv("REDIS_URL", "redis://localhost:6379")
LOG_QUEUE='neuralops:logs:queue'
DATABASE_URL=os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/neuralops")
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)
def start_worker():
    print(f"Starting AI Worker , connecting to Redis at {REDIS_URL}...")
    client=redis.Redis.from_url(REDIS_URL)
    print("Connected to Redis. Waiting for log messages...")
    while True:
        try:
            result=client.blpop(LOG_QUEUE, timeout=0)
            if result:
                _,raw_data=result
                process_log(raw_data)
        except Exception as e:
            print(f"Error processing log: {e}")
            import time
            time.sleep(5)
    
def process_log(raw_data:str):
    """
    Parses the log,generates an embedding, and stores the result back in Redis.
    """
    try:
        log_entry=json.loads(raw_data)
        message=log_entry.get("message","")
        service_id=log_entry.get("id")
        level=log_entry.get("level","INFO")
        
        if not message or not service_id:
            print(f"Invalid log entry: {log_entry}")
            return
        #1 .Generate embedding
        vector = embedding_service.generate_embedding(message)     
        #2. Store embedding in Postgres
        conn=get_db_connection()
        cursor=conn.cursor()
        insert_query = """
            INSERT INTO "Log" (id, "serviceId", level, message, metadata, embedding, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            log_entry["eventId"],
            service_id,
            level,
            message,
            json.dumps(log_entry.get("metadata", {})),
            f"[{','.join(map(str, vector))}]", # Formats list to Postgres vector syntax: [0.1, 0.2, ...]
            log_entry["ingestedAt"]
        ))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"Processed log for service {service_id} with embedding vector of length {len(vector)}")
    except Exception as e:
        print(f"Database error: {e}")