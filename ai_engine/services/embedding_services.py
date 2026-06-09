from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        print("Loading embedding model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded.")
    def generate_embedding(self,text:str)->list[float]:
        """ 
        Takes a raw log message and converts it into a vector embedding using the loaded model.
        """
        vector = self.model.encode(text).tolist()
        return vector

embedding_service = EmbeddingService()