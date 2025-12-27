import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export interface UserMemory {
  name?: string;
  preferences?: string[];
  facts?: string[];
  lastUpdated?: Date;
}

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
  userMemory: Annotation<UserMemory>({
    reducer: (x, y) => {
      return {
        ...x,
        ...y,
        facts: [...(x?.facts || []), ...(y?.facts || [])].filter((v, i, a) => a.indexOf(v) === i),
        lastUpdated: new Date(),
      };
    },
    default: () => ({}),
  }),
});

export type AgentStateType = typeof AgentState.State;

