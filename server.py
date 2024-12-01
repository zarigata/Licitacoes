import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import ollama
import chromadb
import pdfplumber
import json

OLLAMA_HOST = "http://192.168.15.115:11434"
ollama_client = ollama.Client(host=OLLAMA_HOST)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Check Ollama connection
        ollama_client.list()
        return jsonify({"status": "healthy", "message": "Server is running and Ollama is connected"})
    except Exception as e:
        return jsonify({"status": "unhealthy", "message": str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400
    
    try:
        # Extract text from PDF
        pdf = pdfplumber.open(file)
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        pdf.close()
        
        # Initialize ChromaDB
        chroma_client = chromadb.Client()
        collection = chroma_client.create_collection(name="documents")
        
        # Store document in ChromaDB
        collection.add(
            documents=[text],
            metadatas=[{"source": file.filename}],
            ids=[file.filename]
        )
        
        # Extract key information using Ollama
        prompt = """Analise o seguinte documento de licitação e extraia as seguintes informações:
        1. Preço máximo
        2. Requisitos de prova de conceito
        3. Capital social mínimo
        4. Requisitos de atestado técnico
        
        Documento:
        {text}
        
        Responda em formato JSON com as seguintes chaves:
        {
            "preco_maximo": "valor encontrado ou N/A",
            "prova_conceito": "requisitos encontrados ou N/A",
            "capital_social": "valor encontrado ou N/A",
            "atestado_tecnico": "requisitos encontrados ou N/A"
        }
        """
        
        response = ollama_client.chat(model='llama2', messages=[{
            'role': 'user',
            'content': prompt.format(text=text[:4000])  # Limit text size for initial analysis
        }])
        
        try:
            extracted_info = json.loads(response['message']['content'])
        except:
            extracted_info = {
                "preco_maximo": "N/A",
                "prova_conceito": "N/A",
                "capital_social": "N/A",
                "atestado_tecnico": "N/A"
            }
        
        return jsonify({
            "message": "File processed successfully",
            "filename": file.filename,
            "extracted_info": extracted_info
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
