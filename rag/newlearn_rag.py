import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, Document
from llama_index.readers.file import PDFReader
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS, allowing requests from any origin
CORS(app)

# Get API key from environment variable
API_KEY = os.getenv('API_KEY')

# Global variable to store the query engine
rag_query_engine = None

# Decorator for API key authentication
def require_apikey(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        if request.headers.get('X-Api-Key') and request.headers.get('X-Api-Key') == API_KEY:
            return view_function(*args, **kwargs)
        else:
            return jsonify({"error": "Invalid or missing API key"}), 401
    return decorated_function

@app.route('/upload', methods=['POST'])
@require_apikey
def upload_file():
    global rag_query_engine
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith('.pdf'):
        # Read the PDF file
        pdf_reader = PDFReader()
        documents = pdf_reader.load_data(file)
        
        # Create the index from these documents
        index = VectorStoreIndex.from_documents(documents)
        
        # Create the query engine
        rag_query_engine = index.as_query_engine()
        
        return jsonify({"message": "File uploaded and processed successfully"}), 200
    else:
        return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400

@app.route('/query', methods=['POST'])
@require_apikey
def query():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    question = request.json.get('question')
    if not question:
        return jsonify({"error": "Question is required"}), 400

    if rag_query_engine is None:
        return jsonify({"error": "No document has been uploaded yet"}), 400

    response = rag_query_engine.query(question)
    return jsonify({'answer': response.response})

if __name__ == '__main__':
    app.run(debug=True)
