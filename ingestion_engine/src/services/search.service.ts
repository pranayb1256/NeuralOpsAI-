const PYTHON_AI_URL=process.env.PYTHON_AI_URL || 'http://localhost:8000';
export class SearchService {

    static async executeSearch(serviceId:string, queryText:string,limit:number=5)
     {
        try{
            const response = await fetch(`${PYTHON_AI_URL}/api/v1/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body:JSON.stringify({
                    serviceId,
                    query_text:queryText,
                    limit
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error:any) {
            console.error('Error executing search:', error);
            throw new Error(`AI search failed: ${error.message}`);
        }
     }
}