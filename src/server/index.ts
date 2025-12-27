import express from "express";
import cors from "cors";
import { agentGraph } from "../agent/graph.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import type { UserMemory } from "../agent/state.js";

const app = express();
const PORT = 3001;

console.log("✅ Agent loaded, graph ready to use");

app.use(cors());
app.use(express.json());

interface SessionData {
  messages: Array<HumanMessage | AIMessage>;
  userMemory: UserMemory;
  sessionId: string;
}

const sessions = new Map<string, SessionData>();

function getSessionId(req: express.Request): string {
  return (req.headers['x-session-id'] as string) || req.ip || 'default-session';
}

function validateMessage(message: unknown): message is string {
  return typeof message === "string" && message.trim().length > 0;
}

function extractMessageContent(message: AIMessage): string {
  const { content } = message;
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item !== null && 'text' in item) {
          return String((item as { text: string }).text);
        }
        return JSON.stringify(item);
      })
      .join(' ');
  }
  
  if (content != null) {
    return String(content);
  }
  
  throw new Error("Message does not contain content");
}

function getOrCreateSession(sessionId: string): SessionData {
  let session = sessions.get(sessionId);
  
  if (!session) {
    session = {
      messages: [],
      userMemory: {},
      sessionId,
    };
    sessions.set(sessionId, session);
    console.log("🆕 Created new session:", sessionId);
  }
  
  return session;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!validateMessage(message)) {
      return res.status(400).json({ error: "Message is required and must be a non-empty string" });
    }

    const currentSessionId = sessionId || getSessionId(req);
    const session = getOrCreateSession(currentSessionId);

    console.log("🤖 Processing message for session:", currentSessionId);
    
    const userMessage = new HumanMessage(message);
    const allMessages = [...session.messages, userMessage];
    
    const result = await agentGraph.invoke({
      messages: allMessages,
      userMemory: session.userMemory,
    });

    if (!result.messages?.length) {
      throw new Error("Agent did not return messages");
    }

    const lastMessage = result.messages[result.messages.length - 1] as AIMessage;
    const response = extractMessageContent(lastMessage);

    session.messages = result.messages;
    if (result.userMemory) {
      session.userMemory = result.userMemory;
    }

    res.json({
      response,
      llmCalls: result.llmCalls || 0,
      sessionId: currentSessionId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("❌ Error processing request:", errorMessage);
    if (errorStack) {
      console.error("Stack trace:", errorStack);
    }
    
    res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Ollama LangGraph Agent" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/chat`);
});

