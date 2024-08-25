from openai import OpenAI

# Initialize the client with your API key
client = OpenAI(api_key="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")

def ask_openai(prompt):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

if __name__ == "__main__":
    prompt = "What is the capital of France?"
    answer = ask_openai(prompt)
    if answer:
        print(f"Answer: {answer}")
    else:
        print("Failed to get an answer.")
