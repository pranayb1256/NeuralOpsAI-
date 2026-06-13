# ai_engine/agents/nodes.py (Upgraded for Production)
import os
import psycopg2
from typing import Dict, Any
from pydantic import BaseModel, Field, SecretStr
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from agents.state import IncidentState

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/neuralops")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# Initialize the LLM (Requires OPENAI_API_KEY in your environment variables)
# Temperature is set to 0 because we want deterministic, factual engineering analysis, not creativity.
llm = ChatGroq(
    api_key=SecretStr(GROQ_API_KEY) if GROQ_API_KEY else None,
    model="llama3-8b-8192", # Lightning fast 8-billion parameter model
    temperature=0
)

# --- 1. Define the Strict Output Schemas ---

class RootCauseSchema(BaseModel):
    root_cause_analysis: str = Field(description="A concise, technical explanation of the infrastructure failure.")

class RemediationSchema(BaseModel):
    remediation_plan: list[str] = Field(description="A sequential, step-by-step list of actionable commands or fixes.")

class IncidentNodes:

    @staticmethod
    def context_retriever(state: IncidentState) -> Dict[str, Any]:
        """
        Agent 1: (Unchanged) Pulls the structural context from PostgreSQL.
        """
        print("🔍 [Agent 1: Retriever] Pulling structural context...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT level, message FROM "Log"
            WHERE "serviceId" = %s
            ORDER BY timestamp DESC LIMIT 30
        """, (state["service_id"],))
        recent_logs = [{"level": r[0], "message": r[1]} for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        return {"context_logs": recent_logs, "similar_past_incidents": []}

    @staticmethod
    def root_cause_analyzer(state: IncidentState) -> Dict[str, Any]:
        """
        Agent 2: Uses an LLM to read the logs and deduce the exact failure.
        """
        print("🧠 [Agent 2: LLM Analyzer] Analyzing log syntax via AI...")
        
        # Format the logs into a readable string for the LLM context window
        log_text = "\n".join([f"[{l['level']}] {l['message']}" for l in state["context_logs"]])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Senior Site Reliability Engineer. Analyze the provided server logs and diagnose the exact root cause of the system failure. Be highly technical and objective."),
            ("human", "System Logs:\n{logs}")
        ])

        # Bind the Pydantic schema to the LLM to force JSON output
        chain = prompt | llm.with_structured_output(RootCauseSchema)
        
        # Execute the AI call
        result = chain.invoke({"logs": log_text})

        return {"root_cause_analysis": result.root_cause_analysis}

    @staticmethod
    def action_commander(state: IncidentState) -> Dict[str, Any]:
        """
        Agent 3: Uses an LLM to read the root cause and generate a fix playbook.
        """
        print("⚡ [Agent 3: LLM Commander] Generating execution playbook via AI...")
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Senior DevOps Architect. Based on the provided root cause analysis, write a step-by-step incident remediation plan. Do not include introductory text, just the actionable steps."),
            ("human", "Root Cause Analysis: {analysis}")
        ])

        chain = prompt | llm.with_structured_output(RemediationSchema)
        
        result = chain.invoke({"analysis": state["root_cause_analysis"]})

        return {
            "remediation_plan": result.remediation_plan,
            "investigation_complete": True
        }
        
        
        
        