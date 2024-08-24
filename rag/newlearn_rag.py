import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, Document, Settings
from PyPDF2 import PdfReader
import uuid
import openai


# Load environment variables
load_dotenv()
# Hardcode the API key (for testing purposes only)
openai.api_key = "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"

# Set the API key in llama_index settings
Settings.openai_api_key = openai.api_key

app = Flask(__name__)

# Enable CORS for all origins
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Global variable to store the query engine
rag_query_engine = None

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    print(f"Received {request.method} request to /upload")
    print(f"Headers: {request.headers}")
    
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    global rag_query_engine
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith('.pdf'):
        print(f"Processing file: {file.filename}")
        try:
            # Read the PDF file
            pdf_reader = PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            
            # Create a Document object with the text content and a unique ID
            document = Document(text=text, id_=str(uuid.uuid4()))
            
            # Create the index from this document
            index = VectorStoreIndex.from_documents([document])
            
            # Create the query engine
            rag_query_engine = index.as_query_engine()
            
            print("File processed successfully")
            return jsonify({"message": "File uploaded and processed successfully"}), 200
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400
    
@app.route('/query', methods=['POST'])
def query():
    print(f"Received {request.method} request to /query")
    print(f"Headers: {request.headers}")
    
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    question = request.json.get('question')
    if not question:
        return jsonify({"error": "Question is required"}), 400

    if rag_query_engine is None:
        return jsonify({"error": "No document has been uploaded yet"}), 400

    try:
        print(f"Processing query: {question}")
        response = rag_query_engine.query(question)
        print("Query processed successfully")
        return jsonify({'answer': str(response)})
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        return jsonify({"error": f"Error processing query: {str(e)}"}), 500

if __name__ == '__main__':
    print(f"Starting Flask app on http://localhost:8002")
    app.run(host='0.0.0.0', port=8002, debug=True)
