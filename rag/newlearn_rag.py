import os
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from llama_index.core import VectorStoreIndex, Document, Settings
from PyPDF2 import PdfReader
import uuid
import openai
from tqdm import tqdm
import time
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import StorageContext, load_index_from_storage



# Load environment variables
load_dotenv()
# Hardcode the API key (for testing purposes only)
openai.api_key = "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"

# Set the API key in llama_index settings
Settings.openai_api_key = openai.api_key

from openai import OpenAI
client = OpenAI(api_key="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")


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


# Global variable to store the query engine
rag_query_engine = None
progress = 0

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
            global progress
            progress = 0
            
            # Read the PDF file
            pdf_reader = PdfReader(file)
            text = ""
            for page in tqdm(pdf_reader.pages, desc="Reading PDF"):
                text += page.extract_text()
                progress += 1
                time.sleep(0.1)  # Simulate longer processing time
            
            progress = 0
            # Create a Document object with the text content and a unique ID
            document = Document(text=text, id_=str(uuid.uuid4()))
            
            print("Starting embedding process...")
            
            # Initialize the OpenAIEmbedding
            embed_model = OpenAIEmbedding(model="text-embedding-ada-002")
            
            # Create the index from this document
            index = VectorStoreIndex.from_documents(
                [document],
                embed_model=embed_model
            )
            
            # Save the index
            index.storage_context.persist("./storage")
            
            print("Embedding complete.")
            print(f"Sample of embedded text: {text[:200]}...")  # Print first 200 characters
            
            # Load the index to get the embeddings
            storage_context = StorageContext.from_defaults(persist_dir="./storage")
            loaded_index = load_index_from_storage(storage_context)
            
            # Access a node to get its embedding
            first_node = loaded_index.docstore.get_node(list(loaded_index.docstore.docs.keys())[0])
            if first_node and first_node.embedding:
                print(f"Embedding dimensions: {len(first_node.embedding)}")
                print(f"Sample of first embedding: {first_node.embedding[:5]}")  # Print first 5 values
            
            # Create the query engine
            rag_query_engine = index.as_query_engine()
            
            print("File processed successfully")
            return jsonify({"message": "File uploaded and processed successfully"}), 200
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400


def get_progress():
    def generate():
        global progress
        while True:
            yield f"data: {progress}\n\n"
            time.sleep(0.5)
    return Response(generate(), mimetype='text/event-stream')    

@app.route('/query', methods=['POST'])
def query():
    print(f"Received {request.method} request to /query")
    print(f"Headers: {request.headers}")
    
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    question = request.json.get('question')
    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        print(f"Processing query: {question}")
        
        # Load the index from storage
        storage_context = StorageContext.from_defaults(persist_dir="./storage")
        index = load_index_from_storage(storage_context)
        
        # Set up the query engine with hybrid mode
        query_engine = index.as_query_engine()
        
        # Process the query
        response = query_engine.query(question)
        
        print("Query processed successfully")
        return jsonify({'answer': str(response)})
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        return jsonify({"error": f"Error processing query: {str(e)}"}), 500

if __name__ == '__main__':
    print(f"Starting Flask app on http://localhost:8002")
    app.run(host='0.0.0.0', port=8002, debug=True)
