'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      <div className="container mx-auto px-10 md:px-28">
        <h1 className="text-4xl font-bold text-center pt-20 pb-6"> Hello! Play Trivia with a Crypto-Enabled GPT to win an NFT </h1>
        <h2 className="text-md md:text-xl font-light text-center pb-8 px-8 lg:px-26">Start the conversation below, say Hi - Game on!</h2>
        <h3 className="text-md md:text-xl font-light text-center pb-12 px-6 lg:px-18">Allow a few seconds to the system to start</h3>

        <p className="text-xs font-extralight text-gray-500 text-center xs:px-24">
          This demo by Simone Leonelli was built with just Next.js, OpenAI's API, and{' '}
          <a 
            href="https://docs.syndicate.io"
            className="text-blue-500 hover:underline"
            target="_blank"
          >
            Syndicate's Transaction Cloud API.
          </a>
          </p>
          <p className="text-xs font-extralight text-gray-500 text-center xs:px-24">
            Check out the repo{' '}
          <a 
            href="https://github.com/ianDAOs/demo-crypto-llm-20questions"
            className="text-blue-500 hover:underline"
            target="_blank"
          >
            here
          </a>
        </p>
      </div>
      <div className="flex flex-col w-full max-w-md pt-20 pb-48 mx-auto stretch">
        {messages.length > 0
          ? messages.map((m, index) => (
              <div key={index} className="whitespace-pre-wrap py-1">
                {m.role === 'user' ? <span className="text-lg font-bold text-cyan-600">You: </span>: <span className="text-lg font-bold text-purple-600">GPT: </span>}
                {m.role === 'assistant' ? m.content : m.content}
              </div>
            ))
          : null}

        <form onSubmit={handleSubmit}>
          <input
            className="fixed bottom-10 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
            value={input}
            placeholder="Ask your question..."
            onChange={handleInputChange}
          />
        </form>
      </div>
    </div>
  );
}

