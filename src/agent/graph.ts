import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { llmNode, extractMemoryNode } from "./nodes";

console.log("🔧 Compiling agent graph...");
export const agentGraph = new StateGraph(AgentState)
  .addNode("llm", llmNode)
  .addNode("extract_memory", extractMemoryNode)
  .addEdge(START, "llm")
  .addEdge("llm", "extract_memory")
  .addEdge("extract_memory", END)
  .compile();
console.log("✅ Graph compiled successfully");

