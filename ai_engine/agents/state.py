from typing import TypedDict,List,Dict,Any

class IncidentState(TypedDict):
    service_id:str
    trigger_event_id:str
    reason:str
    
    context_logs:List[Dict[str,Any]]
    similar_past_incidents:List[Dict[str,Any]]
    root_cause_analysis:str
    remediation_plan:List[str]
    
    inverstigation_complete:bool