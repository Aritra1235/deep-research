import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: "GEMINI_API_KEY",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "gemini-1.5-flash",
    messages: [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    stream: true,
  });

  for await (const chunk of completion) {
    console.log(chunk.choices[0].delta.content);
  }
}

main();