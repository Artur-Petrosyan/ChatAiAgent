import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { SystemMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import type { AgentStateType } from "./state";
import type { UserMemory } from "./state";

const OLLAMA_CONFIG = {
  baseUrl: "http://localhost:11434",
  model: "mistral",
} as const;

const model = new ChatOllama({
  ...OLLAMA_CONFIG,
  temperature: 0.7,
});

const extractionModel = new ChatOllama({
  ...OLLAMA_CONFIG,
  temperature: 0.3,
});

function createSystemMessage(userMemory: UserMemory): SystemMessage {
  const basePrompt = "You are a helpful AI assistant. Answer user questions in a friendly and informative manner. Use English for communication.";
  
  if (!userMemory || Object.keys(userMemory).length === 0) {
    return new SystemMessage(basePrompt);
  }
  
  const memoryParts: string[] = [];
  
  if (userMemory.name) {
    memoryParts.push(`- User name: ${userMemory.name}`);
  }
  
  if (userMemory.facts?.length) {
    memoryParts.push(`- User facts:\n${userMemory.facts.map((fact) => `  • ${fact}`).join('\n')}`);
  }
  
  if (userMemory.preferences?.length) {
    memoryParts.push(`- User preferences:\n${userMemory.preferences.map((pref) => `  • ${pref}`).join('\n')}`);
  }
  
  if (memoryParts.length === 0) {
    return new SystemMessage(basePrompt);
  }
  
  const systemPrompt = `${basePrompt}\n\nUser information you should remember:\n${memoryParts.join('\n')}\n\nUse this information to personalize responses and demonstrate that you remember the user.`;
  
  return new SystemMessage(systemPrompt);
}

export async function llmNode(state: AgentStateType) {
  try {
    const systemMessage = createSystemMessage(state.userMemory);
    const response = await model.invoke([systemMessage, ...state.messages]);

    return {
      messages: [response],
      llmCalls: 1,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in llmNode:", errorMessage);
    
    const errorResponse = new AIMessage(
      `Sorry, an error occurred while accessing Ollama: ${errorMessage}. ` +
      `Make sure Ollama is running (ollama serve) and the mistral model is installed.`
    );
    
    return {
      messages: [errorResponse],
      llmCalls: 0,
    };
  }
}

function parseExtractedInfo(responseText: string): Partial<UserMemory> {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const facts = Array.isArray(parsed.facts) 
      ? parsed.facts.filter((f: unknown) => typeof f === 'string' && f.trim()).map((f: string) => f.trim())
      : [];
    const preferences = Array.isArray(parsed.preferences)
      ? parsed.preferences.filter((p: unknown) => typeof p === 'string' && p.trim()).map((p: string) => p.trim())
      : [];
    
    const extractedInfo: Partial<UserMemory> = {};
    
    if (parsed.name && typeof parsed.name === 'string' && parsed.name.trim()) {
      extractedInfo.name = parsed.name.trim();
    }
    if (facts.length > 0) {
      extractedInfo.facts = facts;
    }
    if (preferences.length > 0) {
      extractedInfo.preferences = preferences;
    }
    
    return extractedInfo;
  } catch {
    return {};
  }
}

function mergeMemoryArrays<T>(arr1: T[] | undefined, arr2: T[] | undefined): T[] {
  const merged = [...(arr1 || []), ...(arr2 || [])];
  return Array.from(new Set(merged));
}

export async function extractMemoryNode(state: AgentStateType) {
  try {
    const recentMessages = state.messages.slice(-50);
    const userMessages = recentMessages.filter((msg): msg is HumanMessage => msg instanceof HumanMessage);
    
    if (userMessages.length === 0) {
      return { userMemory: state.userMemory || {} };
    }

    const extractionPrompt = `Analyze the following user messages and extract important information about them.
Extract the following information if mentioned:
1. User name
2. Interesting facts about the user (profession, hobbies, preferences, personal information)
3. User preferences

User messages:
${userMessages.map((msg, i) => `${i + 1}. ${msg.content}`).join('\n')}

Return the answer in JSON format with fields:
{
  "name": "name or null",
  "facts": ["fact1", "fact2", ...],
  "preferences": ["preference1", "preference2", ...]
}

If there is no information, return empty arrays and null for name. Answer ONLY JSON, without additional text.`;

    const extractionResponse = await extractionModel.invoke([
      new SystemMessage("You are a helper for extracting structured information from text. Answer only with valid JSON."),
      new HumanMessage(extractionPrompt),
    ]);

    const responseText = typeof extractionResponse.content === 'string' 
      ? extractionResponse.content 
      : String(extractionResponse.content);
    
    const extractedInfo = parseExtractedInfo(responseText);

    const updatedMemory: UserMemory = {
      ...state.userMemory,
      ...extractedInfo,
      facts: mergeMemoryArrays(state.userMemory?.facts, extractedInfo.facts),
      preferences: mergeMemoryArrays(state.userMemory?.preferences, extractedInfo.preferences),
      lastUpdated: new Date(),
    };

    return { userMemory: updatedMemory };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in extractMemoryNode:", errorMessage);
    return { userMemory: state.userMemory || {} };
  }
}

