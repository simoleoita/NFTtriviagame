// ./app/api/chat/route.ts
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import fetch from 'node-fetch';

let round = 0;  // Initialize  count
const maxRound = 20;  // Set max questions
let gameWon = false; // Initialize game state

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

// send an NFT as a prize to the user
async function sendNFT(ethAddress: string) {

  // Define the Syndicate API endpoint
  const endpoint = 'https://api.syndicate.io/transact/sendTransaction';

  // Define the headers
  const headers = {
    'Authorization': `Bearer ${process.env.SYNDICATE_API_KEY}`,
    'Content-Type': 'application/json'
  };

  // Define the body data
  const bodyData = {
    projectId: process.env.PROJECT_ID,
    contractAddress: '0xbEc332E1eb3EE582B36F979BF803F98591BB9E24',
    chainId: 80001,
    functionSignature: 'mint(address account)',
    args: {
      account: ethAddress
    }
  };

  // Sent the API request and return the response based on the status code
  try {

    // Send the API request to Syndicate
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData)
    });

    // Parse the JSON response
    const responseData = await response.json();

    // Check the response status
    if (response.ok) {
      // Transaction was successful
      return { status: 'success', data: responseData };
    } else {
      // Handle errors with the transaction (e.g., 400, 500, etc.)
      console.error('Error sending NFT:', responseData);
      return { status: 'error', error: responseData };
    }
  } catch (error) {
    // Handle network or parsing errors
    console.error('Error:', error);
    return { status: 'error', error };
  }
}

// Get transaction hash from transactionId using Syndicate API with retry logic
async function getTransactionHash(transactionId: string): Promise<string> {
  let transactionHash = '';
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`
    }
  };

  // Keep trying until the transaction hash is available
  while (!transactionHash) {
    try {
      const response = await fetch(`https://api.syndicate.io/wallet/project/${process.env.PROJECT_ID}/request/${transactionId}`, options);
      const data = await response.json();
      transactionHash = data.transactionAttempts[0]?.hash || '';
    } catch (error) {
      console.error('Error getting transaction details:', error);
    }
    // Wati for a few seconds before retrying
    if (!transactionHash) {
      await new Promise(resolve => setTimeout(resolve, 5000));  // Wait for 5 seconds
    }
  }

  return transactionHash;
}

// Main chat route
export async function POST(req: Request) {

  // If the game has already been won and the prize has been sent
  if (gameWon) {
    const gameEndMessage = new TextEncoder().encode("You won the prize. Congratulations Legend!");
    return new StreamingTextResponse(new ReadableStream({
      start(controller) {
        controller.enqueue(gameEndMessage);
        controller.close();
      }
    }));
  }

  // Update the s asked count
  round++;

  // If the game hasn't been won and the max s have been asked, end the game
  if (!gameWon && round > maxRound) {
    const gameEndMessage = new TextEncoder().encode("You've run out of allowed messages! So close and play again.");
    return new StreamingTextResponse(new ReadableStream({
      start(controller) {
        controller.enqueue(gameEndMessage);
        controller.close();
      }
    }));
  }

  // Extract the user prompt from the body of the request and convert it to lowercase
  const { messages } = await req.json();

  // Game context that is sent to OpenAI
  const gameContext = {
    role: "system",
    content: `
        You start the chat by greeting the player with a message.
        You start the game with round one.
        Trivia Quiz Game Instructions:
        Round Structure:
        The game will consist of multiple rounds, max 3. 
        Each round, You will provide the player with a trivia question.
        Answering Questions:
        There are no penalties for wrong answers, so the player can feel free to guess if unsure!
        Scoring:
        You can keep track of your score.
        For each correct answer, the player gets 1 point.
        To win, the player has to score 3 points, basically, he has to answer correctly three times, and he has a maximum of 20 messages.
        The player can decide the number of rounds he wants to play, or he can keep going until he decides to stop.
      
        Difficulty Level:
        Ask the player If it has a preference for the difficulty level of the questions (easy, medium, hard), please let me know.
        Ask the player If it  has any preference for specific topics (like history, science, pop culture, etc.), feel free to mention that as well.
        Describe the options in bullet points (e.g. 1. Easy, etc.. )
        


        
        Feedback:
        After each answer, you'll provide the correct answer and a brief explanation of max 25 words or an interesting fact related to the question.
        
  
        If th player answers the right answer 3 times, he wins.
        The player can play the same answer multiple times during the three different games.
        You reveal the correct answer only after the player plays(and a brief explanation of max 25 words or an interesting fact related to the question)
        After each response, indicate the number of rounds remaining by stating "(X rounds left)".
        If the player misspells the word, ask and suggest for clarification.

        If the player wins the game, ask them to send an email to "simone@w230.net" with this code: TRIVIAWIN12 to get a FREE NFT then display the URL of the NFT so the player can check it beforehand "https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/18037974610060282928518498914949954732032679124616004511962298399299183978377 "
    `
  };

  // Combine the game context with the user prompts into an array
  const combinedMessages = [gameContext, ...messages];

  // If the user guesses the correct word, send them an NFT
  if (round > 1 && combinedMessages[combinedMessages.length - 2].content.includes('prize')) {
    
    // Update the game state to won
    gameWon = true;

    // Send the prize NFT to the user's Ethereum address
    const ethAddress = combinedMessages[combinedMessages.length - 1].content;
    const sendNftResponse = await sendNFT(ethAddress);

    // Fetch the transaction hash
    const transactionHash = await getTransactionHash(sendNftResponse.data.transactionId);

    // If there is a transaction hash, send a message with the transaction URL
    if (transactionHash) {
      const transactionUrl = `https://mumbai.polygonscan.com/tx/${transactionHash}`;
      const sentNftMessage = new TextEncoder().encode(`Thank you! Your prize has been sent to ${ethAddress}. See it at ${transactionUrl}`);

      return new StreamingTextResponse(new ReadableStream({
        start(controller) {
          controller.enqueue(sentNftMessage);
          controller.close();
        }
      }));
    } else {
      const errorMessage = new TextEncoder().encode(`Thank you! Your prize has been sent to ${ethAddress}, but we are unable to retrieve the transaction details at the moment.`);

      return new StreamingTextResponse(new ReadableStream({
        start(controller) {
          controller.enqueue(errorMessage);
          controller.close();
        }
      }));
    }

  }

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    stream: true,
    messages: combinedMessages,
    temperature: 0.5,
    max_tokens: 120,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
