import pdfplumber
import chromadb
import ollama
import os
import requests

# Configure Ollama client
OLLAMA_HOST = "http://192.168.15.115:11434"
os.environ["OLLAMA_HOST"] = OLLAMA_HOST

class LicitacaoRAG:
    def __init__(self, db_path="./chromadb"):
        self.chroma_client = chromadb.PersistentClient(path=db_path)
        self.collection = self.chroma_client.get_or_create_collection(name="licitacao_collection")
        
    def extract_pdf_text(self, pdf_path):
        """Extract text from PDF and split into chunks"""
        chunks = []
        metadata = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text:
                    # Split text into smaller chunks (paragraphs)
                    paragraphs = text.split('\n\n')
                    for i, para in enumerate(paragraphs):
                        if para.strip():
                            chunks.append(para.strip())
                            metadata.append({
                                "page": page_num,
                                "chunk": i,
                                "source": os.path.basename(pdf_path)
                            })
        
        return chunks, metadata
    
    def store_document(self, pdf_path):
        """Process and store document in ChromaDB"""
        chunks, metadata = self.extract_pdf_text(pdf_path)
        
        # Generate unique IDs for each chunk
        ids = [f"doc_{os.path.basename(pdf_path)}_p{meta['page']}_c{meta['chunk']}" 
               for meta in metadata]
        
        # Store in ChromaDB
        self.collection.add(
            documents=chunks,
            metadatas=metadata,
            ids=ids
        )
        
        return len(chunks)
    
    def query_document(self, query, n_results=5):
        """Query the document collection"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            include=["documents", "metadatas"]
        )
        return results
    
    def extract_licitacao_info(self, pdf_path):
        """Extract specific information from licitação document"""
        # Store the document first
        self.store_document(pdf_path)
        
        # Queries in Portuguese for specific information
        queries = {
            "preco": "Qual é o valor máximo ou preço estimado desta licitação? Procure por valores em R$ ou reais.",
            "prova_conceito": "Existe necessidade de prova de conceito? Quais são os requisitos? Se não encontrar menção explícita, responda que não foi encontrada exigência de POC.",
            "capital_social": "Qual é o capital social mínimo exigido? Procure por porcentagem do valor estimado ou valor específico.",
            "atestado": "Quais são os requisitos do atestado técnico ou atestado de capacidade técnica? Liste os principais requisitos."
        }
        
        results = {}
        
        # Query each aspect and generate response using Ollama
        for key, query in queries.items():
            retrieved = self.query_document(query)
            context = "\n".join(retrieved["documents"][0])
            
            try:
                # Generate response using Ollama
                response = ollama.chat(
                    model="llama3.2",  # Using Llama 3.2
                    messages=[
                        {
                            "role": "system",
                            "content": """Você é um assistente especializado em análise de documentos de licitação.
                            Responda de forma objetiva e direta, citando valores e requisitos específicos quando disponíveis.
                            Se a informação não estiver disponível no contexto, responda 'Informação não encontrada'.
                            Para valores monetários, mantenha o formato R$ X.XXX,XX.
                            Para o atestado técnico, liste os requisitos em tópicos se houver mais de um."""
                        },
                        {
                            "role": "user",
                            "content": f"Com base no seguinte trecho do edital:\n\n{context}\n\n{query}"
                        }
                    ]
                )
                
                results[key] = {
                    "response": response["message"]["content"],
                    "source": retrieved["metadatas"][0][0]
                }
            except Exception as e:
                print(f"Error querying Ollama for {key}: {str(e)}")
                # Fallback to direct context if Ollama fails
                results[key] = {
                    "response": "Erro na análise: " + str(e),
                    "source": retrieved["metadatas"][0][0]
                }
        
        return results

# Example usage
if __name__ == "__main__":
    rag = LicitacaoRAG()
    
    # Example of processing a new document
    pdf_path = "caminho_do_edital.pdf"  # Replace with actual path
    try:
        results = rag.extract_licitacao_info(pdf_path)
        print("\nInformações Extraídas da Licitação:")
        print("====================================")
        
        for key, info in results.items():
            print(f"\n{key.upper()}:")
            print(f"Resposta: {info['response']}")
            print(f"Fonte: Página {info['source']['page']}")
            
    except Exception as e:
        print(f"Erro ao processar documento: {str(e)}")
