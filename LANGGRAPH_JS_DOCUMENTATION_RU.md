# LangGraph.js - Документация на русском языке

## Оглавление
1. [Введение](#введение)
2. [Установка](#установка)
3. [Основные концепции](#основные-концепции)
4. [Quickstart - Быстрый старт](#quickstart---быстрый-старт)
5. [Thinking in LangGraph - Философия LangGraph](#thinking-in-langgraph---философия-langgraph)
6. [API Справочник](#api-справочник)
7. [Работа с сообщениями](#работа-с-сообщениями)
8. [Примеры использования](#примеры-использования)
9. [Продвинутые возможности](#продвинутые-возможности)
10. [Работа с чекпоинтами](#работа-с-чекпоинтами)
11. [Интеграция с LangChain](#интеграция-с-langchain)
12. [Production готовность](#production-готовность)
13. [Лучшие практики](#лучшие-практики)

---

## Введение

**LangGraph.js** — это низкоуровневый фреймворк для оркестрации AI-агентов, позволяющий создавать управляемые и надежные приложения с поддержкой долговременной памяти и взаимодействием с человеком в процессе выполнения задач.

### Основные возможности:

- **Надежность и управляемость:** Контроль над действиями агентов с возможностью модерации и включения человека в процесс принятия решений
- **Гибкость и расширяемость:** Создание кастомных архитектур агентов с низкоуровневыми примитивами
- **Поддержка потоковой передачи:** Передача данных по токенам и промежуточных шагов
- **Визуализация:** Возможность визуализировать граф выполнения
- **Персистентность:** Сохранение состояния между сессиями

---

## Установка

### Базовая установка

```bash
npm install @langchain/langgraph @langchain/core
```

Или с помощью других менеджеров пакетов:

```bash
# pnpm
pnpm add @langchain/langgraph @langchain/core

# yarn
yarn add @langchain/langgraph @langchain/core

# bun
bun add @langchain/langgraph @langchain/core
```

### Дополнительные пакеты

Для работы с чекпоинтерами:

```bash
# SQLite чекпоинтер
npm install @langchain/langgraph-checkpoint-sqlite

# PostgreSQL чекпоинтер
npm install @langchain/langgraph-checkpoint-postgres
```

Для интеграции с LangChain:

```bash
npm install @langchain/core @langchain/anthropic @langchain/openai
```

### Требования

- Node.js 18+ или совместимая среда выполнения
- TypeScript 5.0+ (рекомендуется, но не обязательно)

---

## Основные концепции

### 1. Граф (Graph)
Граф представляет собой структуру узлов и переходов, определяющую поток выполнения вашего агента. В LangGraph.js есть два способа определения графа:
- **Graph API** - явное определение узлов и рёбер
- **Functional API** - определение как одной функции (для простых случаев)

### 2. Узлы (Nodes)
Узлы — это функции, которые выполняют определенную логику и обновляют состояние. Каждый узел получает текущее состояние и возвращает частичное обновление состояния.

### 3. Состояние (State)
Состояние — это данные, которые передаются между узлами графа. Может быть определено двумя способами:
- **Zod схема** - традиционный способ с валидацией
- **Annotation API** - современный способ с reducer функциями

### 4. Память (Memory)
Механизм сохранения и восстановления состояния между вызовами графа. Включает:
- **Краткосрочная память** - состояние текущего выполнения
- **Долгосрочная память** - данные между сессиями (через InMemoryStore)

### 5. Чекпоинты (Checkpoints)
Точки сохранения состояния для возможности отката и восстановления. Позволяют:
- Восстанавливать выполнение после сбоев
- Откатываться к предыдущим состояниям
- Отлаживать агентов

### 6. Reducer функции
Reducer определяет, как объединяются значения при обновлении состояния:
- Для массивов: добавление элементов
- Для объектов: слияние свойств
- Для примитивов: замена или накопление значений

---

## API Справочник

### Annotation API

Annotation API используется для определения состояния графа с помощью аннотаций вместо Zod схем.

#### Annotation.Root()

Создает корневую аннотацию состояния.

```typescript
import { Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  counter: Annotation<number>({
    reducer: (x, y) => (y ?? x) ?? 0,
    default: () => 0,
  }),
});

type StateType = typeof State.State;
```

#### MessagesAnnotation

Встроенная аннотация для работы с сообщениями.

```typescript
import { MessagesAnnotation } from "@langchain/langgraph";

// Использование встроенной аннотации
const State = Annotation.Root({
  ...MessagesAnnotation.spec,
  // Добавление дополнительных полей
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
});
```

#### Reducer функции

Reducer определяет, как объединяются значения состояния:

- `(x, y) => [...x, ...y]` - для массивов (добавление)
- `(x, y) => (y ?? x) ?? defaultValue` - для замены значения
- `(x, y) => x + y` - для суммирования
- `(x, y) => ({ ...x, ...y })` - для объектов (слияние)

### StateGraph

Основной класс для создания графа выполнения.

#### Конструктор

```typescript
// С Zod схемой
new StateGraph(stateSchema: z.ZodObject<any>)

// С Annotation
new StateGraph(Annotation.Root({ ... }))
```

**Параметры:**
- `stateSchema` - Zod схема или Annotation, определяющая структуру состояния

#### Методы

##### `addNode(name: string, node: NodeFunction)`

Добавляет узел в граф.

**Параметры:**
- `name` - уникальное имя узла
- `node` - функция узла, принимающая `(state, runtime)` и возвращающая обновленное состояние

**Пример:**
```typescript
graph.addNode("process", async (state, runtime) => {
    // Логика обработки
    return { message: ["Обработано"] };
});
```

##### `addEdge(from: string, to: string)`

Добавляет переход между узлами.

**Параметры:**
- `from` - имя исходного узла (или константа `START`)
- `to` - имя целевого узла (или константа `END`)

**Пример:**
```typescript
graph.addEdge(START, "process");
graph.addEdge("process", END);
```

##### `addConditionalEdges(from: string, condition: ConditionFunction, pathMap: Record<string, string>)`

Добавляет условные переходы между узлами.

**Параметры:**
- `from` - имя исходного узла
- `condition` - функция, определяющая следующий узел на основе состояния
- `pathMap` - объект, сопоставляющий результаты условия с именами узлов

**Пример:**
```typescript
graph.addConditionalEdges(
    "check",
    (state) => state.value > 10 ? "high" : "low",
    {
        high: "processHigh",
        low: "processLow"
    }
);
```

##### `compile(options?: CompileOptions)`

Компилирует граф в исполняемую форму.

**Параметры:**
- `options.checkpointer` - экземпляр чекпоинтера для сохранения состояния
- `options.store` - хранилище для данных (например, память)

**Возвращает:** Скомпилированный граф

**Пример:**
```typescript
const compiledGraph = graph.compile({
    checkpointer: new MemorySaver(),
    store: new InMemoryStore()
});
```

### MemorySaver

Класс для сохранения состояния в памяти.

#### Конструктор

```typescript
new MemorySaver()
```

**Пример:**
```typescript
const checkpointer = new MemorySaver();
```

### InMemoryStore

Класс для хранения данных в памяти (например, воспоминаний агента).

#### Конструктор

```typescript
new InMemoryStore()
```

**Пример:**
```typescript
const store = new InMemoryStore();
```

#### Методы

##### `put(namespace: string[], key: string, value: any)`

Сохраняет значение в хранилище.

**Параметры:**
- `namespace` - массив строк, определяющий пространство имен
- `key` - уникальный ключ
- `value` - значение для сохранения

**Пример:**
```typescript
await store.put(["user1", "memories"], "key1", { text: "Воспоминание" });
```

##### `get(namespace: string[], key: string)`

Получает значение из хранилища.

**Параметры:**
- `namespace` - массив строк, определяющий пространство имен
- `key` - ключ для поиска

**Возвращает:** Сохраненное значение или `undefined`

**Пример:**
```typescript
const value = await store.get(["user1", "memories"], "key1");
```

##### `search(namespace: string[], query?: string)`

Выполняет поиск в хранилище.

**Параметры:**
- `namespace` - массив строк, определяющий пространство имен
- `query` - опциональный поисковый запрос

**Возвращает:** Массив найденных записей

**Пример:**
```typescript
const results = await store.search(["user1", "memories"]);
```

### Скомпилированный граф

#### `invoke(input: State, config?: Config)`

Выполняет граф с заданным входным состоянием.

**Параметры:**
- `input` - начальное состояние
- `config` - конфигурация выполнения
  - `config.configurable.thread_id` - идентификатор потока
  - `config.configurable.user_id` - идентификатор пользователя

**Возвращает:** Финальное состояние

**Пример:**
```typescript
const result = await graph.invoke(
    { message: ["Привет"], user: "Вася" },
    {
        configurable: {
            thread_id: "thread1",
            user_id: "Вася"
        }
    }
);
```

#### `stream(input: State, config?: Config)`

Выполняет граф с потоковой передачей промежуточных результатов.

**Параметры:**
- `input` - начальное состояние
- `config` - конфигурация выполнения

**Возвращает:** Асинхронный итератор состояний

**Пример:**
```typescript
for await (const state of graph.stream(input, config)) {
    console.log("Промежуточное состояние:", state);
}
```

### Runtime объект

Объект `runtime` передается в каждый узел и предоставляет доступ к:

- `runtime.context` - контекст выполнения (например, `user_id`)
- `runtime.store` - хранилище данных
- `runtime.checkpoint` - текущий чекпоинт

**Пример использования:**
```typescript
graph.addNode("node", async (state, runtime) => {
    const userId = runtime.context?.user_id;
    const namespace = [userId, "memories"];
    const memories = await runtime.store?.search(namespace) || [];
    // ...
});
```

### Работа с сообщениями

LangGraph.js использует систему сообщений из LangChain для обмена данными между узлами.

#### Типы сообщений

```typescript
import {
  HumanMessage,      // Сообщение от пользователя
  AIMessage,         // Сообщение от AI
  SystemMessage,     // Системное сообщение
  ToolMessage,       // Сообщение от инструмента
  FunctionMessage    // Сообщение от функции
} from "@langchain/core/messages";
```

#### Примеры использования

```typescript
// Создание сообщений
const humanMsg = new HumanMessage("Привет!");
const aiMsg = new AIMessage("Здравствуйте!");
const systemMsg = new SystemMessage("Ты полезный ассистент.");

// Проверка типа сообщения
if (AIMessage.isInstance(lastMessage)) {
  // Работа с AI сообщением
  const toolCalls = lastMessage.tool_calls;
}

// Создание ToolMessage
const toolMsg = new ToolMessage({
  content: "Результат инструмента",
  tool_call_id: "call_123"
});
```

#### Работа с tool_calls

```typescript
async function processToolCalls(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);
  
  if (!AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }
  
  const toolMessages: ToolMessage[] = [];
  
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const result = await tool.invoke(toolCall.args);
    
    toolMessages.push(
      new ToolMessage({
        content: JSON.stringify(result),
        tool_call_id: toolCall.id,
      })
    );
  }
  
  return { messages: toolMessages };
}
```

---

## Quickstart - Быстрый старт

Этот раздел демонстрирует создание агента-калькулятора с использованием Graph API или Functional API.

### Вариант 1: Graph API

Graph API позволяет определить агента как граф узлов и рёбер.

#### 1. Определение инструментов и модели

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  temperature: 0,
});

// Определение инструментов
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "Divide two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});

// Расширение LLM инструментами
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);
```

#### 2. Определение состояния

Состояние графа используется для хранения сообщений и количества вызовов LLM.

```typescript
import { StateGraph, START, END, MessagesAnnotation, Annotation } from "@langchain/langgraph";

const MessagesState = Annotation.Root({
  ...MessagesAnnotation.spec,
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),
});

// Извлечение типа состояния для сигнатур функций
type MessagesStateType = typeof MessagesState.State;
```

#### 3. Определение узла модели

Узел модели используется для вызова LLM и принятия решения о вызове инструмента.

```typescript
import { SystemMessage } from "@langchain/core/messages";

async function llmCall(state: MessagesStateType) {
  return {
    messages: [await modelWithTools.invoke([
      new SystemMessage(
        "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
      ),
      ...state.messages,
    ])],
    llmCalls: 1,
  };
}
```

#### 4. Определение узла инструментов

Узел инструментов используется для вызова инструментов и возврата результатов.

```typescript
import { AIMessage, ToolMessage } from "@langchain/core/messages";

async function toolNode(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result };
}
```

#### 5. Определение логики завершения

Условная функция рёбер используется для маршрутизации к узлу инструментов или завершения на основе того, сделал ли LLM вызов инструмента.

```typescript
async function shouldContinue(state: MessagesStateType) {
  const lastMessage = state.messages.at(-1);

  // Проверка, является ли это AIMessage перед доступом к tool_calls
  if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
    return END;
  }

  // Если LLM делает вызов инструмента, выполняем действие
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  // Иначе останавливаемся (отвечаем пользователю)
  return END;
}
```

#### 6. Построение и компиляция агента

Агент строится с использованием класса StateGraph и компилируется методом compile.

```typescript
const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

// Вызов
import { HumanMessage } from "@langchain/core/messages";

const result = await agent.invoke({
  messages: [new HumanMessage("Add 3 and 4.")],
});

for (const message of result.messages) {
  console.log(`[${message.type}]: ${message.text}`);
}
```

### Вариант 2: Functional API

Functional API позволяет определить агента как одну функцию. Это более простой подход для базовых случаев, но менее гибкий, чем Graph API.

#### createReactAgent

Создает ReAct агента (Reasoning + Acting) из одной функции.

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  temperature: 0,
});

const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers",
  schema: z.object({
    a: z.number(),
    b: z.number(),
  }),
});

const agent = createReactAgent({
  llm: model,
  tools: [add],
  // Опциональные параметры:
  // messageModifier: (messages) => messages, // Модификация сообщений
  // checkpointer: new MemorySaver(),         // Чекпоинтер
  // interruptBefore: [],                     // Прерывания
  // interruptAfter: [],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "Add 3 and 4." }],
});
```

#### Преимущества Functional API

- **Простота**: Меньше кода для базовых случаев
- **Быстрый старт**: Идеально для прототипирования
- **Встроенная логика**: ReAct паттерн уже реализован

#### Ограничения Functional API

- **Меньше контроля**: Нельзя настроить поток выполнения
- **Фиксированная архитектура**: Только ReAct паттерн
- **Сложная кастомизация**: Для сложных случаев лучше Graph API

#### Когда использовать

**Используйте Functional API когда:**
- Нужен простой ReAct агент
- Быстрое прототипирование
- Стандартная логика достаточна

**Используйте Graph API когда:**
- Нужна кастомная логика
- Сложные условные переходы
- Множественные узлы с разной логикой
- Полный контроль над выполнением

---

## Примеры использования

### Пример 1: Простой граф

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import * as z from "zod";

// Определение состояния
const State = z.object({
    message: z.array(z.string()),
    counter: z.number()
});

// Создание графа
const workflow = new StateGraph(State)
    .addNode("increment", async (state) => {
        return {
            message: [...state.message, `Счетчик: ${state.counter + 1}`],
            counter: state.counter + 1
        };
    })
    .addEdge(START, "increment")
    .addEdge("increment", END);

// Компиляция
const graph = workflow.compile();

// Выполнение
const result = await graph.invoke({
    message: [],
    counter: 0
});

console.log(result);
```

### Пример 2: Граф с памятью

```typescript
import { StateGraph, MemorySaver, InMemoryStore, START, END } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";

const State = z.object({
    message: z.array(z.string()),
    user: z.string()
});

const checkpointer = new MemorySaver();
const memoryStore = new InMemoryStore();

const workflow = new StateGraph(State)
    .addNode("remember", async (state, runtime) => {
        const userId = runtime.context?.user_id;
        const namespace = [userId, "memories"];
        
        // Читаем память
        const memories = await runtime.store?.search(namespace) || [];
        const memoryText = memories.map(m => m.value.text).join("; ");
        
        // Сохраняем новое воспоминание
        const lastMessage = state.message.at(-1);
        if (lastMessage) {
            await runtime.store?.put(
                namespace,
                uuidv4(),
                { text: lastMessage }
            );
        }
        
        return {
            message: [
                ...state.message,
                memoryText 
                    ? `Ты уже говорил: ${memoryText}` 
                    : "Я пока ничего о тебе не знаю"
            ]
        };
    })
    .addEdge(START, "remember")
    .addEdge("remember", END);

const graph = workflow.compile({
    checkpointer,
    store: memoryStore
});

// Первый вызов
await graph.invoke(
    { message: ["Привет!"], user: "Вася" },
    { configurable: { thread_id: "1", user_id: "Вася" } }
);

// Второй вызов (с памятью)
await graph.invoke(
    { message: ["Что я говорил?"], user: "Вася" },
    { configurable: { thread_id: "2", user_id: "Вася" } }
);
```

### Пример 3: Граф с условными переходами

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import * as z from "zod";

const State = z.object({
    value: z.number(),
    result: z.string().optional()
});

const workflow = new StateGraph(State)
    .addNode("check", async (state) => {
        return { ...state };
    })
    .addNode("processHigh", async (state) => {
        return { 
            ...state, 
            result: `Большое значение: ${state.value}` 
        };
    })
    .addNode("processLow", async (state) => {
        return { 
            ...state, 
            result: `Малое значение: ${state.value}` 
        };
    })
    .addEdge(START, "check")
    .addConditionalEdges(
        "check",
        (state) => state.value > 10 ? "high" : "low",
        {
            high: "processHigh",
            low: "processLow"
        }
    )
    .addEdge("processHigh", END)
    .addEdge("processLow", END);

const graph = workflow.compile();

const result = await graph.invoke({ value: 15 });
console.log(result.result); // "Большое значение: 15"
```

### Пример 4: Потоковое выполнение

LangGraph.js поддерживает потоковую передачу данных, что позволяет получать промежуточные результаты выполнения графа в реальном времени.

#### Базовое потоковое выполнение

```typescript
const graph = workflow.compile();

const input = { message: ["Начало"], counter: 0 };

for await (const state of graph.stream(input)) {
    console.log("Текущее состояние:", state);
}
```

#### Типы потоковой передачи

LangGraph поддерживает несколько режимов потоковой передачи:

1. **Поток состояний (State stream)** - получаете обновления состояния после каждого узла
2. **Поток значений (Values stream)** - получаете только финальные значения состояния
3. **Поток обновлений (Updates stream)** - получаете только изменения состояния
4. **Поток токенов (Tokens stream)** - получаете токены от LLM в реальном времени

```typescript
// Поток состояний (по умолчанию)
for await (const chunk of graph.stream(input)) {
    // chunk содержит полное состояние после каждого узла
    console.log(chunk);
}

// Поток значений
for await (const chunk of graph.stream(input, { streamMode: "values" })) {
    // chunk содержит только значения состояния
    console.log(chunk);
}

// Поток обновлений
for await (const chunk of graph.stream(input, { streamMode: "updates" })) {
    // chunk содержит только изменения состояния
    console.log(chunk);
}
```

#### Потоковая передача с токенами LLM

Для получения токенов от LLM в реальном времени:

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
    model: "claude-sonnet-4-5-20250929",
    streaming: true, // Включить потоковую передачу
});

const workflow = new StateGraph(State)
    .addNode("llm", async (state) => {
        const stream = await llm.stream(state.messages);
        let fullResponse = "";
        
        for await (const chunk of stream) {
            fullResponse += chunk.content;
            // Можно отправлять токены клиенту в реальном времени
            process.stdout.write(chunk.content);
        }
        
        return { messages: [...state.messages, { role: "assistant", content: fullResponse }] };
    });

const graph = workflow.compile();

// Потоковая передача с промежуточными состояниями
for await (const chunk of graph.stream(input)) {
    if (chunk.llm) {
        // Поток токенов от LLM
        process.stdout.write(chunk.llm.content);
    }
    if (chunk.agent) {
        // Промежуточные состояния агента
        console.log("\nСостояние агента:", chunk.agent);
    }
}
```

#### Потоковая передача с фильтрацией

Вы можете фильтровать, какие узлы отправлять в поток:

```typescript
// Поток только для определенных узлов
for await (const chunk of graph.stream(input, {
    streamMode: "values",
    includeNames: ["llm", "tools"] // Только эти узлы
})) {
    console.log(chunk);
}

// Исключить определенные узлы
for await (const chunk of graph.stream(input, {
    streamMode: "values",
    excludeNames: ["internal"] // Исключить этот узел
})) {
    console.log(chunk);
}
```

#### Потоковая передача с чекпоинтами

При использовании чекпоинтеров потоковая передача работает с сохранением состояния:

```typescript
const graph = workflow.compile({
    checkpointer: new MemorySaver(),
});

const config = { configurable: { thread_id: "thread-1" } };

// Потоковая передача с сохранением состояния
for await (const chunk of graph.stream(input, config)) {
    console.log("Промежуточное состояние:", chunk);
    // Состояние автоматически сохраняется в чекпоинтер
}
```

---

## Лучшие практики

### 1. Определение состояния

- Используйте Zod схемы для валидации состояния
- Делайте состояние неизменяемым (immutable)
- Группируйте связанные данные вместе

```typescript
const State = z.object({
    messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
    })),
    metadata: z.object({
        userId: z.string(),
        timestamp: z.number()
    })
});
```

### 2. Работа с памятью

LangGraph.js поддерживает два типа памяти:
- **Краткосрочная память (Working Memory)**: Состояние текущего выполнения графа
- **Долгосрочная память (Long-term Memory)**: Данные, сохраняемые между сессиями через InMemoryStore

#### Использование InMemoryStore

```typescript
import { InMemoryStore } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

const memoryStore = new InMemoryStore();

const graph = workflow.compile({
    store: memoryStore,
});

// В узле графа
async function rememberNode(state: State, runtime: Runtime) {
    const userId = runtime.context?.user_id;
    const namespace = [userId, "memories"];
    
    // Читаем память
    const memories = await runtime.store?.search(namespace) || [];
    const memoryText = memories
        .map(m => m.value.text)
        .join("; ");
    
    // Сохраняем новое воспоминание
    const lastMessage = state.message.at(-1);
    if (lastMessage) {
        await runtime.store?.put(
            namespace,
            uuidv4(),
            { text: lastMessage, timestamp: Date.now() }
        );
    }
    
    return {
        message: [
            ...state.message,
            memoryText 
                ? `Ты уже говорил: ${memoryText}` 
                : "Я пока ничего о тебе не знаю"
        ]
    };
}
```

#### Организация памяти с пространствами имен

Используйте пространства имен для организации данных:

```typescript
// Пространство имен для пользователя
const userNamespace = [userId, "conversations"];

// Пространство имен для конкретной беседы
const conversationNamespace = [userId, "conversations", conversationId];

// Пространство имен для воспоминаний
const memoryNamespace = [userId, "memories"];

// Сохранение данных
await store.put(conversationNamespace, messageId, {
    role: "user",
    content: "Привет!",
    timestamp: Date.now()
});

// Поиск данных
const messages = await store.search(conversationNamespace);

// Получение конкретного значения
const message = await store.get(conversationNamespace, messageId);
```

#### Семантический поиск в памяти

Для более продвинутого поиска можно использовать векторные хранилища:

```typescript
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();
const vectorStore = new MemoryVectorStore(embeddings);

async function searchMemory(query: string) {
    // Семантический поиск похожих воспоминаний
    const results = await vectorStore.similaritySearch(query, 3);
    return results.map(r => r.pageContent);
}

// В узле графа
async function searchNode(state: State) {
    const query = state.messages[state.messages.length - 1].content;
    const relevantMemories = await searchMemory(query);
    
    return {
        messages: [
            ...state.messages,
            {
                role: "system",
                content: `Релевантные воспоминания: ${relevantMemories.join("\n")}`
            }
        ]
    };
}
```

#### Очистка памяти

Регулярно очищайте старые записи для управления размером памяти:

```typescript
// Удаление старых записей
async function cleanupOldMemories(userId: string, maxAge: number) {
    const namespace = [userId, "memories"];
    const memories = await store.search(namespace);
    
    const now = Date.now();
    for (const memory of memories) {
        if (memory.value.timestamp && (now - memory.value.timestamp) > maxAge) {
            await store.delete(namespace, memory.key);
        }
    }
}

// Удаление всех записей в пространстве имен
async function clearNamespace(namespace: string[]) {
    const items = await store.search(namespace);
    for (const item of items) {
        await store.delete(namespace, item.key);
    }
}
```

#### Лучшие практики работы с памятью

- **Используйте пространства имен**: Организуйте данные логически
- **Сохраняйте только необходимое**: Не храните избыточные данные
- **Регулярно очищайте**: Удаляйте старые записи
- **Используйте метаданные**: Добавляйте timestamp, tags и другую информацию
- **Ограничивайте размер**: Устанавливайте лимиты на количество записей

### 3. Обработка ошибок

- Всегда обрабатывайте ошибки в узлах
- Используйте try-catch блоки
- Возвращайте понятные сообщения об ошибках

```typescript
graph.addNode("safe", async (state) => {
    try {
        // Опасная операция
        return { result: "Успех" };
    } catch (error) {
        return { 
            error: `Ошибка: ${error.message}` 
        };
    }
});
```

### 4. Тестирование

- Тестируйте каждый узел отдельно
- Используйте моки для внешних зависимостей
- Проверяйте граничные случаи

### 5. Производительность

- Минимизируйте количество узлов
- Используйте параллельное выполнение где возможно
- Кэшируйте результаты дорогих операций

---

## Константы

### START
Константа, представляющая начальный узел графа.

### END
Константа, представляющая конечный узел графа.

---

## Типы

### NodeFunction
```typescript
type NodeFunction = (
    state: State,
    runtime: Runtime
) => Promise<Partial<State>> | Partial<State>;
```

### ConditionFunction
```typescript
type ConditionFunction = (state: State) => string;
```

### Config
```typescript
type Config = {
    configurable?: {
        thread_id?: string;
        user_id?: string;
        [key: string]: any;
    };
};
```

---

## Thinking in LangGraph - Философия LangGraph

### Ключевые принципы

LangGraph.js следует нескольким ключевым принципам:

1. **Низкоуровневость**: LangGraph не абстрагирует промпты или архитектуру - вы полностью контролируете логику
2. **Оркестрация**: Фокус на управлении потоком выполнения, а не на высокоуровневых абстракциях
3. **Состояние**: Состояние является центральным - оно сохраняется и передается между узлами
4. **Графы**: Вы определяете граф узлов и рёбер, который описывает поток выполнения

### Когда использовать LangGraph

Используйте LangGraph когда вам нужно:
- Долгосрочное выполнение с сохранением состояния
- Человеческое вмешательство в процесс
- Сложная условная логика и ветвления
- Отладка и визуализация выполнения
- Восстановление после сбоев

Не используйте LangGraph для:
- Простых цепочек вызовов LLM (используйте LangChain chains)
- Статических промптов без состояния
- Простых агентов без сложной логики

### Workflows vs Agents

**Workflows (Рабочие процессы)**:
- Детерминированные потоки выполнения
- Предопределенные шаги
- Минимум условной логики
- Пример: обработка документов, ETL процессы

**Agents (Агенты)**:
- Динамическое принятие решений
- Использование инструментов
- Адаптивное поведение
- Пример: чат-боты, автономные агенты

LangGraph поддерживает оба подхода.

#### Настройка для Workflows и Agents

Для создания workflow или агента вы можете использовать любую чат-модель, которая поддерживает структурированные выходы и вызовы инструментов. Следующий пример использует Anthropic:

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  apiKey: "<your_anthropic_key>"
});
```

#### LLM и расширения

Workflows и агентные системы основаны на LLM и различных расширениях, которые вы к ним добавляете. Вызовы инструментов, структурированные выходы и краткосрочная память — это несколько вариантов для настройки LLM под ваши нужды.

```typescript
import * as z from "zod";
import { tool } from "langchain";

// Схема для структурированного выхода
const SearchQuery = z.object({
  search_query: z.string().describe("Запрос, оптимизированный для веб-поиска."),
  justification: z
    .string()
    .describe("Почему этот запрос релевантен запросу пользователя."),
});

// Расширить LLM схемой для структурированного выхода
const structuredLlm = llm.withStructuredOutput(SearchQuery);

// Вызвать расширенный LLM
const output = await structuredLlm.invoke(
  "Как оценка кальция CT связана с высоким холестерином?"
);

// Определить инструмент
const multiply = tool(
  ({ a, b }) => {
    return a * b;
  },
  {
    name: "multiply",
    description: "Умножить два числа",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  }
);

// Расширить LLM инструментами
const llmWithTools = llm.bindTools([multiply]);

// Вызвать LLM с вводом, который запускает вызов инструмента
const msg = await llmWithTools.invoke("Сколько будет 2 умножить на 3?");

// Получить вызов инструмента
console.log(msg.tool_calls);
```

#### Цепочки промптов (Prompt Chaining)

Цепочка промптов — это когда каждый вызов LLM обрабатывает выход предыдущего вызова. Это часто используется для выполнения хорошо определенных задач, которые могут быть разбиты на меньшие, проверяемые шаги. Некоторые примеры включают:
- Перевод документов на разные языки
- Проверка сгенерированного контента на согласованность

**Пример: Генерация и улучшение шутки**

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// Состояние графа
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  improvedJoke: Annotation<string>,
  finalJoke: Annotation<string>,
});

// Определить функции узлов

// Первый вызов LLM для генерации начальной шутки
async function generateJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Напиши короткую шутку про ${state.topic}`);
  return { joke: msg.content };
}

// Функция-ворота для проверки, есть ли у шутки кульминация
function checkPunchline(state: typeof StateAnnotation.State) {
  // Простая проверка - содержит ли шутка "?" или "!"
  if (state.joke?.includes("?") || state.joke?.includes("!")) {
    return "Pass";
  }
  return "Fail";
}

// Второй вызов LLM для улучшения шутки
async function improveJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(
    `Сделай эту шутку смешнее, добавив игру слов: ${state.joke}`
  );
  return { improvedJoke: msg.content };
}

// Третий вызов LLM для финальной полировки
async function polishJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(
    `Добавь неожиданный поворот к этой шутке: ${state.improvedJoke}`
  );
  return { finalJoke: msg.content };
}

// Построить workflow
const chain = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addEdge(START, "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: END
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", END)
  .compile();

// Вызвать
const state = await chain.invoke({ topic: "кошки" });
console.log("Начальная шутка:");
console.log(state.joke);
console.log("\n--- --- ---\n");
if (state.improvedJoke !== undefined) {
  console.log("Улучшенная шутка:");
  console.log(state.improvedJoke);
  console.log("\n--- --- ---\n");
  console.log("Финальная шутка:");
  console.log(state.finalJoke);
}
```

---

## Продвинутые возможности

### Прерывания (Interrupts) - Human-in-the-Loop

Прерывания позволяют приостановить выполнение графа в определенных точках и дождаться внешнего ввода перед продолжением. Это включает паттерны "человек в цикле" (human-in-the-loop), где требуется внешний ввод для продолжения. Когда прерывание срабатывает, LangGraph сохраняет состояние графа с помощью слоя персистентности и ждет неопределенно долго, пока вы не возобновите выполнение.

#### Как работают прерывания

Прерывания работают путем вызова функции `interrupt()` в любой точке узлов графа. Функция принимает любое JSON-сериализуемое значение, которое передается вызывающей стороне. Когда вы готовы продолжить, вы возобновляете выполнение, повторно вызывая граф с помощью `Command`, который затем становится возвращаемым значением вызова `interrupt()` внутри узла.

В отличие от статических точек останова (которые останавливаются до или после конкретных узлов), прерывания динамичны — они могут быть размещены где угодно в вашем коде и могут быть условными на основе логики приложения.

**Ключевые концепции:**
- **Чекпоинтинг сохраняет ваше место**: чекпоинтер записывает точное состояние графа, чтобы вы могли возобновить позже, даже когда находитесь в состоянии ошибки.
- **thread_id — ваш указатель**: используйте `{ configurable: { thread_id: ... } }` как опции для метода invoke, чтобы сообщить чекпоинтеру, какое состояние загружать.
- **Полезные нагрузки прерываний отображаются как `__interrupt__`**: значения, которые вы передаете в `interrupt()`, возвращаются вызывающей стороне в поле `__interrupt__`, чтобы вы знали, чего ждет граф.
- **thread_id, который вы выбираете, по сути является вашим постоянным курсором**: повторное использование возобновляет тот же чекпоинт; использование нового значения запускает совершенно новый поток с пустым состоянием.

#### Пауза с помощью interrupt

Функция `interrupt` приостанавливает выполнение графа и возвращает значение вызывающей стороне. Когда вы вызываете `interrupt` внутри узла, LangGraph сохраняет текущее состояние графа и ждет, пока вы возобновите выполнение с вводом.

Для использования `interrupt` вам нужно:
1. Чекпоинтер для сохранения состояния графа (используйте устойчивый чекпоинтер в production)
2. Thread ID в вашей конфигурации, чтобы runtime знал, из какого состояния возобновлять
3. Вызвать `interrupt()` там, где вы хотите сделать паузу (полезная нагрузка должна быть JSON-сериализуемой)

```typescript
import { interrupt, Command } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const State = z.object({
    message: z.array(z.string()),
    approved: z.boolean().optional()
});

async function approvalNode(state: State) {
    // Пауза и запрос одобрения
    // Полезная нагрузка отображается в result.__interrupt__
    const approved = interrupt("Вы одобряете это действие?");
    
    // Command({ resume: ... }) предоставляет значение, возвращаемое в эту переменную
    return { approved };
}

const workflow = new StateGraph(State)
    .addNode("approval", approvalNode)
    .addEdge(START, "approval")
    .addEdge("approval", END);

const graph = workflow.compile({ checkpointer });

// Первый запуск - попадает в прерывание и останавливается
// thread_id — это устойчивый указатель обратно к сохраненному чекпоинту
const config = { configurable: { thread_id: "thread-1" } };
const result = await graph.invoke({ message: [] }, config);

// Проверить, что было прервано
// __interrupt__ отражает каждую полезную нагрузку, которую вы передали в interrupt()
console.log(result.__interrupt__);
// [{ value: 'Вы одобряете это действие?', ... }]

// Возобновить с ответом человека
// Command({ resume }) возвращает это значение из interrupt() в узле
await graph.invoke(new Command({ resume: true }), config);
```

**Что происходит при вызове interrupt:**
1. Выполнение графа приостанавливается в точной точке, где вызывается interrupt
2. Состояние сохраняется с помощью чекпоинтера, чтобы выполнение могло быть возобновлено позже (в production это должен быть устойчивый чекпоинтер, например, поддерживаемый базой данных)
3. Значение возвращается вызывающей стороне под `__interrupt__`; это может быть любое JSON-сериализуемое значение (строка, объект, массив и т.д.)
4. Граф ждет неопределенно долго, пока вы не возобновите выполнение с ответом
5. Ответ передается обратно в узел, когда вы возобновляете, становясь возвращаемым значением вызова `interrupt()`

#### Возобновление прерываний

После того, как прерывание приостанавливает выполнение, вы возобновляете граф, вызывая его снова с `Command`, который содержит значение resume. Значение resume передается обратно в вызов interrupt, позволяя узлу продолжить выполнение с внешним вводом.

**Ключевые моменты о возобновлении:**
- Вы должны использовать тот же thread ID при возобновлении, который использовался при возникновении прерывания
- Значение, переданное в `Command({ resume: ... })`, становится возвращаемым значением вызова interrupt
- Узел перезапускается с начала узла, где был вызван interrupt, когда возобновляется, поэтому любой код до interrupt выполняется снова
- Вы можете передать любое JSON-сериализуемое значение как значение resume

#### Общие паттерны

Ключевая вещь, которую разблокируют прерывания, — это возможность приостановить выполнение и дождаться внешнего ввода. Это полезно для различных случаев использования, включая:

- **Рабочие процессы одобрения**: Пауза перед выполнением критических действий (вызовы API, изменения базы данных, финансовые транзакции)
- **Проверка и редактирование**: Позволить людям проверять и изменять выходные данные LLM или вызовы инструментов перед продолжением
- **Прерывание вызовов инструментов**: Пауза перед выполнением вызовов инструментов для проверки и редактирования вызова инструмента перед выполнением
- **Валидация человеческого ввода**: Пауза перед переходом к следующему шагу для валидации человеческого ввода

##### Одобрить или отклонить

Одним из наиболее распространенных использований прерываний является пауза перед критическим действием и запрос одобрения. Например, вы можете захотеть попросить человека одобрить вызов API, изменение базы данных или любое другое важное решение.

```typescript
import { interrupt, Command } from "@langchain/langgraph";

function approvalNode(state: State): Command {
  // Приостановить выполнение; полезная нагрузка отображается в result.__interrupt__
  const isApproved = interrupt({
    question: "Вы хотите продолжить?",
    details: state.actionDetails
  });

  // Маршрутизация на основе ответа
  if (isApproved) {
    return new Command({ goto: "proceed" }); // Выполняется после предоставления полезной нагрузки resume
  } else {
    return new Command({ goto: "cancel" });
  }
}

// Чтобы одобрить
await graph.invoke(new Command({ resume: true }), config);

// Чтобы отклонить
await graph.invoke(new Command({ resume: false }), config);
```

##### Проверка и редактирование состояния

Иногда вы хотите позволить человеку проверить и отредактировать часть состояния графа перед продолжением. Это полезно для исправления LLM, добавления отсутствующей информации или внесения корректировок.

```typescript
import { interrupt, Command } from "@langchain/langgraph";

function reviewNode(state: State) {
  // Пауза и показать текущий контент для проверки (отображается в result.__interrupt__)
  const editedContent = interrupt({
    instruction: "Проверьте и отредактируйте этот контент",
    content: state.generatedText
  });

  // Обновить состояние отредактированной версией
  return { generatedText: editedContent };
}

// При возобновлении предоставьте отредактированный контент:
await graph.invoke(
  new Command({ resume: "Отредактированный и улучшенный текст" }), // Значение становится возвратом из interrupt()
  config
);
```

##### Прерывания в инструментах

Вы также можете разместить прерывания непосредственно внутри функций инструментов. Это делает сам инструмент приостанавливающимся для одобрения всякий раз, когда он вызывается, и позволяет человеку проверять и редактировать вызов инструмента перед его выполнением.

```typescript
import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import * as z from "zod";

const sendEmailTool = tool(
  async ({ to, subject, body }) => {
    // Пауза перед отправкой; полезная нагрузка отображается в result.__interrupt__
    const response = interrupt({
      action: "send_email",
      to,
      subject,
      body,
      message: "Одобрить отправку этого письма?",
    });

    if (response?.action === "approve") {
      // Значение resume может переопределить входные данные перед выполнением
      const finalTo = response.to ?? to;
      const finalSubject = response.subject ?? subject;
      const finalBody = response.body ?? body;
      return `Письмо отправлено на ${finalTo} с темой '${finalSubject}'`;
    }
    return "Письмо отменено пользователем";
  },
  {
    name: "send_email",
    description: "Отправить письмо получателю",
    schema: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
  },
);
```

Этот подход полезен, когда вы хотите, чтобы логика одобрения жила вместе с самим инструментом, делая его переиспользуемым в разных частях вашего графа. LLM может вызывать инструмент естественным образом, и прерывание будет приостанавливать выполнение всякий раз, когда инструмент вызывается, позволяя вам одобрить, отредактировать или отменить действие.

##### Валидация человеческого ввода

Иногда вам нужно проверить ввод от людей и спросить снова, если он недействителен. Вы можете сделать это, используя несколько вызовов interrupt в цикле.

```typescript
import { interrupt } from "@langchain/langgraph";

function getAgeNode(state: State) {
  let prompt = "Сколько вам лет?";

  while (true) {
    const answer = interrupt(prompt); // полезная нагрузка отображается в result.__interrupt__

    // Проверить ввод
    if (typeof answer === "number" && answer > 0) {
      // Действительный ввод - продолжить
      return { age: answer };
    } else {
      // Недействительный ввод - спросить снова с более конкретным промптом
      prompt = `'${answer}' не является действительным возрастом. Пожалуйста, введите положительное число.`;
    }
  }
}
```

Каждый раз, когда вы возобновляете граф с недействительным вводом, он будет спрашивать снова с более четким сообщением. Как только предоставлен действительный ввод, узел завершается, и граф продолжается.

#### Правила работы с прерываниями

Когда вы вызываете `interrupt` внутри узла, LangGraph приостанавливает выполнение, вызывая исключение, которое сигнализирует runtime о паузе. Это исключение распространяется вверх по стеку вызовов и перехватывается runtime, который уведомляет граф о сохранении текущего состояния и ожидании внешнего ввода.

Когда выполнение возобновляется (после того, как вы предоставите запрошенный ввод), runtime перезапускает весь узел с начала — он не возобновляет с точной строки, где был вызван interrupt. Это означает, что любой код, который выполнялся до interrupt, будет выполняться снова. Из-за этого есть несколько важных правил, которым нужно следовать при работе с прерываниями, чтобы обеспечить их ожидаемое поведение.

##### Не оборачивайте вызовы interrupt в try/catch

Способ, которым interrupt приостанавливает выполнение в точке вызова, заключается в выбрасывании специального исключения. Если вы обернете вызов interrupt в блок try/catch, вы перехватите это исключение, и прерывание не будет передано обратно графу.

✅ **Отделяйте вызовы interrupt от подверженного ошибкам кода**
✅ **Условно перехватывайте ошибки при необходимости**

```typescript
// ✅ Хорошо: прерывание сначала, затем обработка условий ошибок отдельно
async function nodeA(state: State) {
    const name = interrupt("Как вас зовут?");
    try {
        await fetchData(); // Это может не удаться
    } catch (err) {
        console.error(err);
    }
    return state;
}

// ❌ Плохо: обертывание interrupt в голый try/catch перехватит исключение прерывания
async function nodeA(state: State) {
    try {
        const name = interrupt("Как вас зовут?");
    } catch (err) {
        console.error(err);
    }
    return state;
}
```

##### Не изменяйте порядок вызовов interrupt в узле

Распространено использование нескольких прерываний в одном узле, однако это может привести к неожиданному поведению, если не обрабатывать осторожно.

Когда узел содержит несколько вызовов interrupt, LangGraph ведет список значений resume, специфичных для задачи, выполняющей узел. Всякий раз, когда выполнение возобновляется, оно начинается с начала узла. Для каждого встреченного interrupt LangGraph проверяет, существует ли соответствующее значение в списке resume задачи. Сопоставление строго основано на индексе, поэтому порядок вызовов interrupt в узле важен.

✅ **Сохраняйте вызовы interrupt согласованными между выполнениями узла**

```typescript
// ✅ Хорошо: вызовы interrupt происходят в том же порядке каждый раз
async function nodeA(state: State) {
    const name = interrupt("Как вас зовут?");
    const age = interrupt("Сколько вам лет?");
    const city = interrupt("В каком городе вы живете?");

    return { name, age, city };
}

// ❌ Плохо: условный пропуск вызовов interrupt изменяет порядок
async function nodeA(state: State) {
    const name = interrupt("Как вас зовут?");

    // При первом запуске это может пропустить interrupt
    // При возобновлении это может не пропустить его - вызывая несоответствие индекса
    if (state.needsAge) {
        const age = interrupt("Сколько вам лет?");
    }

    const city = interrupt("В каком городе вы живете?");

    return { name, city };
}
```

##### Не возвращайте сложные значения в вызовах interrupt

В зависимости от того, какой чекпоинтер используется, сложные значения могут быть не сериализуемыми (например, вы не можете сериализовать функцию). Чтобы сделать ваши графы адаптируемыми к любому развертыванию, лучше всего использовать только значения, которые могут быть разумно сериализованы.

✅ **Передавайте простые, JSON-сериализуемые типы в interrupt**
✅ **Передавайте словари/объекты с простыми значениями**

```typescript
// ✅ Хорошо: передача простых типов, которые сериализуемы
async function nodeA(state: State) {
    const name = interrupt("Как вас зовут?");
    const count = interrupt(42);
    const approved = interrupt(true);

    return { name, count, approved };
}

// ❌ Плохо: передача функции в interrupt
function validateInput(value: string): boolean {
    return value.length > 0;
}

async function nodeA(state: State) {
    const response = interrupt({
        question: "Как вас зовут?",
        validator: validateInput  // Это не удастся
    });
    return { name: response };
}
```

##### Побочные эффекты, вызванные до interrupt, должны быть идемпотентными

Поскольку прерывания работают путем повторного запуска узлов, из которых они были вызваны, побочные эффекты, вызванные до interrupt, должны (в идеале) быть идемпотентными. Для контекста, идемпотентность означает, что одна и та же операция может применяться несколько раз без изменения результата за пределами начального выполнения.

В качестве примера, у вас может быть вызов API для обновления записи внутри узла. Если interrupt вызывается после того, как этот вызов сделан, он будет повторно запускаться несколько раз, когда узел возобновляется, потенциально перезаписывая начальное обновление или создавая дублирующиеся записи.

✅ **Используйте идемпотентные операции до interrupt**
✅ **Размещайте побочные эффекты после вызовов interrupt**
✅ **Разделяйте побочные эффекты на отдельные узлы, когда возможно**

```typescript
// ✅ Хорошо: использование операции upsert, которая идемпотентна
async function nodeA(state: State) {
    // Запуск этого несколько раз даст тот же результат
    await db.upsertUser({
        userId: state.userId,
        status: "pending_approval"
    });

    const approved = interrupt("Одобрить это изменение?");

    return { approved };
}

// ❌ Плохо: создание новой записи до interrupt
async function nodeA(state: State) {
    // Это создаст дублирующиеся записи при каждом возобновлении
    const auditId = await db.createAuditLog({
        userId: state.userId,
        action: "pending_approval",
        timestamp: new Date()
    });

    const approved = interrupt("Одобрить это изменение?");

    return { approved, auditId };
}
```

##### Использование с подграфами, вызываемыми как функции

При вызове подграфа внутри узла родительский граф возобновит выполнение с начала узла, где был вызван подграф и сработало прерывание. Аналогично, подграф также возобновит с начала узла, где был вызван interrupt.

```typescript
async function nodeInParentGraph(state: State) {
    someCode(); // <-- Это будет повторно выполняться при возобновлении
    // Вызвать подграф как функцию.
    // Подграф содержит вызов `interrupt`.
    const subgraphResult = await subgraph.invoke(someInput);
    // ...
}

async function nodeInSubgraph(state: State) {
    someOtherCode(); // <-- Это также будет повторно выполняться при возобновлении
    const result = interrupt("Как вас зовут?");
    // ...
}
```

#### Отладка с прерываниями

Для отладки и тестирования графа вы можете использовать статические прерывания как точки останова для пошагового выполнения графа по одному узлу за раз. Статические прерывания срабатывают в определенных точках либо до, либо после выполнения узла. Вы можете установить их, указав `interruptBefore` и `interruptAfter` при компиляции графа.

**Статические прерывания не рекомендуются для рабочих процессов human-in-the-loop. Используйте функцию interrupt вместо этого.**

```typescript
const graph = builder.compile({
    interruptBefore: ["node_a"],  
    interruptAfter: ["node_b", "node_c"],  
    checkpointer,
});

// Передать thread ID графу
const config = {
    configurable: {
        thread_id: "some_thread"
    }
};

// Запустить граф до точки останова
await graph.invoke(inputs, config);

// Возобновить граф, передав null для ввода
await graph.invoke(null, config);  // Запустит граф до следующей точки останова
```

**Точки останова устанавливаются во время компиляции:**
- `interruptBefore` указывает узлы, где выполнение должно приостановиться до выполнения узла
- `interruptAfter` указывает узлы, где выполнение должно приостановиться после выполнения узла
- Чекпоинтер требуется для включения точек останова
- Граф запускается до первого попадания в точку останова
- Граф возобновляется, передавая null для ввода. Это запустит граф до следующей точки останова

### Интеграция с инструментами (Tools)

LangGraph.js может интегрироваться с инструментами LangChain для расширения возможностей агентов.

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import * as z from "zod";

// Определение инструмента
const calculator = new DynamicStructuredTool({
    name: "calculator",
    description: "Выполняет математические вычисления",
    schema: z.object({
        a: z.number(),
        b: z.number(),
        operation: z.enum(["add", "subtract", "multiply", "divide"])
    }),
    func: async ({ a, b, operation }) => {
        switch (operation) {
            case "add": return (a + b).toString();
            case "subtract": return (a - b).toString();
            case "multiply": return (a * b).toString();
            case "divide": return (a / b).toString();
            default: return "Неизвестная операция";
        }
    }
});

const State = z.object({
    messages: z.array(z.any()),
    tools: z.array(z.any()).optional()
});

const workflow = new StateGraph(State)
    .addNode("agent", async (state) => {
        // Логика агента, который решает использовать инструмент
        return {
            messages: [...state.messages, { tool_calls: [{ name: "calculator", args: { a: 5, b: 3, operation: "add" } }] }]
        };
    })
    .addNode("tools", new ToolNode([calculator]))
    .addEdge(START, "agent")
    .addConditionalEdges(
        "agent",
        (state) => {
            const lastMessage = state.messages[state.messages.length - 1];
            return lastMessage.tool_calls?.length > 0 ? "tools" : "end";
        },
        {
            tools: "tools",
            end: END
        }
    )
    .addEdge("tools", "agent");

const graph = workflow.compile();
```

### Визуализация графов

Вы можете визуализировать структуру графа для лучшего понимания потока выполнения.

```typescript
// Получение структуры графа в формате Mermaid
const mermaidGraph = graph.getGraph().drawMermaid();
console.log(mermaidGraph);

// Или в формате ASCII
const asciiGraph = graph.getGraph().drawASCII();
console.log(asciiGraph);
```

### Параллельное выполнение узлов

Вы можете выполнять несколько узлов параллельно, если они не зависят друг от друга.

```typescript
const workflow = new StateGraph(State)
    .addNode("fetchData1", async (state) => {
        // Асинхронная операция 1
        return { data1: "Результат 1" };
    })
    .addNode("fetchData2", async (state) => {
        // Асинхронная операция 2
        return { data2: "Результат 2" };
    })
    .addNode("combine", async (state) => {
        // Объединение результатов
        return {
            combined: `${state.data1} + ${state.data2}`
        };
    })
    .addEdge(START, "fetchData1")
    .addEdge(START, "fetchData2") // Параллельное выполнение
    .addEdge("fetchData1", "combine")
    .addEdge("fetchData2", "combine")
    .addEdge("combine", END);
```

### Интерцепторы (Interceptors)

Интерцепторы позволяют перехватывать и модифицировать выполнение графа для логирования, мониторинга или отладки.

```typescript
const graph = workflow.compile({
    checkpointer: new MemorySaver(),
    interruptBefore: ["approval"],
    // Интерцептор для логирования
    callbacks: [{
        onNodeStart: (node, state) => {
            console.log(`Начало выполнения узла: ${node}`);
        },
        onNodeEnd: (node, state) => {
            console.log(`Завершение узла: ${node}`);
        }
    }]
});
```

---

## Работа с чекпоинтами

### Восстановление из чекпоинта

Вы можете восстановить выполнение графа с определенного чекпоинта.

```typescript
// Получить список чекпоинтов
const checkpoints = await checkpointer.list(
    { configurable: { thread_id: "thread1" } }
);

// Восстановить состояние из конкретного чекпоинта
const checkpoint = await checkpointer.get(
    { configurable: { thread_id: "thread1" } },
    { checkpoint_id: "checkpoint-id-here" }
);

// Продолжить выполнение с этого чекпоинта
const result = await graph.invoke(
    null, // null означает использование последнего чекпоинта
    {
        configurable: {
            thread_id: "thread1",
            checkpoint_id: "checkpoint-id-here" // Опционально
        }
    }
);
```

### Продвинутые чекпоинтеры

#### SQLiteCheckpointer

Для сохранения чекпоинтов в базу данных SQLite:

```typescript
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

// В памяти (для тестирования)
const checkpointer = await SqliteSaver.fromConnString(":memory:");

// В файл (для production)
const checkpointer = await SqliteSaver.fromConnString("./checkpoints.db");

const graph = workflow.compile({
    checkpointer
});
```

#### PostgreSQL Checkpointer

Для использования PostgreSQL в качестве хранилища чекпоинтов:

```typescript
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = await PostgresSaver.fromConnString(
    "postgresql://user:password@localhost:5432/dbname"
);

// Или с дополнительными опциями
const checkpointer = await PostgresSaver.fromConnString(
    "postgresql://user:password@localhost:5432/dbname",
    {
        tableName: "checkpoints", // Имя таблицы
        schemaName: "public",     // Схема БД
    }
);

const graph = workflow.compile({
    checkpointer
});
```

#### Кастомный чекпоинтер

Вы можете создать свой собственный чекпоинтер:

```typescript
import { BaseCheckpointSaver } from "@langchain/langgraph";

class CustomCheckpointer extends BaseCheckpointSaver {
    async put(config: any, checkpoint: any, metadata: any) {
        // Сохранение чекпоинта
        await this.saveToCustomStorage(config, checkpoint, metadata);
    }

    async get(config: any, checkpointId?: string) {
        // Получение чекпоинта
        return await this.loadFromCustomStorage(config, checkpointId);
    }

    async list(config: any) {
        // Список чекпоинтов
        return await this.listFromCustomStorage(config);
    }
}
```

### Persistence (Персистентность)

Персистентность позволяет сохранять состояние агента между сессиями и перезапусками.

#### Типы персистентности

1. **Чекпоинты** - сохранение состояния выполнения
2. **Память (Memory)** - долгосрочное хранение данных
3. **Векторные хранилища** - семантический поиск

#### Комбинирование чекпоинтов и памяти

```typescript
import { MemorySaver } from "@langchain/langgraph";
import { InMemoryStore } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const memoryStore = new InMemoryStore();

const graph = workflow.compile({
    checkpointer,  // Для состояния выполнения
    store: memoryStore,  // Для долгосрочной памяти
});

// Использование
await graph.invoke(
    { messages: [new HumanMessage("Привет")] },
    {
        configurable: {
            thread_id: "session-1",
            user_id: "user-123",
        },
    }
);
```

#### Миграция чекпоинтов

При изменении схемы состояния может потребоваться миграция:

```typescript
// Старая схема
const OldState = z.object({
    messages: z.array(z.string()),
});

// Новая схема
const NewState = z.object({
    messages: z.array(z.any()),
});

// Функция миграции
function migrateState(oldState: OldState): NewState {
    return {
        messages: oldState.messages.map(msg => ({
            role: "user",
            content: msg,
        })),
    };
}
```

### Очистка чекпоинтов

```typescript
// Удалить все чекпоинты для потока
await checkpointer.delete(
    { configurable: { thread_id: "thread1" } }
);

// Удалить конкретный чекпоинт
await checkpointer.delete(
    { configurable: { thread_id: "thread1" } },
    { checkpoint_id: "checkpoint-id-here" }
);
```

---

## Интеграция с LangChain

### Использование LLM моделей

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import * as z from "zod";

const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0
});

const State = z.object({
    messages: z.array(z.any())
});

const workflow = new StateGraph(State)
    .addNode("llm", async (state) => {
        const response = await llm.invoke(state.messages);
        return {
            messages: [...state.messages, response]
        };
    })
    .addEdge(START, "llm")
    .addEdge("llm", END);

const graph = workflow.compile();
```

### Использование цепочек (Chains)

```typescript
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

const prompt = PromptTemplate.fromTemplate("Ответь на вопрос: {question}");
const chain = new LLMChain({ llm, prompt });

const workflow = new StateGraph(State)
    .addNode("chain", async (state) => {
        const result = await chain.invoke({
            question: state.messages[state.messages.length - 1].content
        });
        return {
            messages: [...state.messages, { role: "assistant", content: result.text }]
        };
    });
```

### Использование векторных хранилищ

```typescript
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();
const vectorStore = new MemoryVectorStore(embeddings);

const workflow = new StateGraph(State)
    .addNode("search", async (state) => {
        const query = state.messages[state.messages.length - 1].content;
        const results = await vectorStore.similaritySearch(query, 3);
        return {
            messages: [...state.messages, { 
                role: "system", 
                content: `Найдено: ${results.map(r => r.pageContent).join("\n")}` 
            }]
        };
    });
```

### Обработка ошибок и повторные попытки

```typescript
import { RunnableRetry } from "@langchain/core/runnables";

const workflow = new StateGraph(State)
    .addNode("retry", async (state) => {
        const retryableOperation = new RunnableRetry({
            runnable: async () => {
                // Операция, которая может завершиться ошибкой
                return await someUnreliableOperation();
            },
            maxAttempts: 3,
            delay: 1000 // Задержка между попытками в миллисекундах
        });
        
        try {
            const result = await retryableOperation.invoke(state);
            return { result };
        } catch (error) {
            return { 
                error: `Ошибка после 3 попыток: ${error.message}` 
            };
        }
    });
```

### Потоковая передача токенов

```typescript
const graph = workflow.compile();

// Потоковая передача с токенами
const stream = await graph.stream(
    { messages: [{ role: "user", content: "Привет!" }] },
    { configurable: { thread_id: "thread1" } }
);

for await (const chunk of stream) {
    if (chunk.llm) {
        // Поток токенов от LLM
        process.stdout.write(chunk.llm.content);
    }
    if (chunk.agent) {
        // Промежуточные состояния агента
        console.log("Состояние агента:", chunk.agent);
    }
}
```

### Durable Execution (Устойчивое выполнение)

Durable Execution позволяет агентам переживать сбои и продолжать выполнение с того места, где остановились.

#### Преимущества

- **Восстановление после сбоев**: Автоматическое восстановление из последнего чекпоинта
- **Долгосрочное выполнение**: Агенты могут работать часами или днями
- **Отладка**: Возможность откатиться к любому чекпоинту
- **Масштабируемость**: Выполнение может быть распределено между серверами

#### Пример

```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();

const graph = workflow.compile({
    checkpointer,
});

// Первый вызов - создает чекпоинт
await graph.invoke(
    { messages: [new HumanMessage("Начни задачу")] },
    { configurable: { thread_id: "task-1" } }
);

// Если произошел сбой, можно продолжить:
const state = await graph.getState({
    configurable: { thread_id: "task-1" }
});

// Продолжить выполнение с последнего чекпоинта
await graph.invoke(
    null, // null означает использование последнего чекпоинта
    { configurable: { thread_id: "task-1" } }
);
```

### Time Travel (Путешествие во времени)

Time Travel позволяет откатиться к любому предыдущему состоянию и продолжить выполнение оттуда.

```typescript
// Получить список всех чекпоинтов
const checkpoints = await checkpointer.list({
    configurable: { thread_id: "thread1" }
});

// Восстановить конкретный чекпоинт
const checkpoint = await checkpointer.get(
    { configurable: { thread_id: "thread1" } },
    { checkpoint_id: "checkpoint-123" }
);

// Продолжить выполнение с этого чекпоинта
await graph.invoke(
    null,
    {
        configurable: {
            thread_id: "thread1",
            checkpoint_id: "checkpoint-123"
        }
    }
);
```

### Subgraphs (Подграфы)

Подграфы позволяют создавать вложенные графы для модульности и переиспользования. Они полезны для:
- Разделения сложной логики на более мелкие, управляемые части
- Переиспользования общих паттернов в разных графах
- Создания иерархических структур графов

#### Создание подграфа

```typescript
// Создание подграфа
const subgraph = new StateGraph(State)
    .addNode("subNode1", node1)
    .addNode("subNode2", node2)
    .addEdge(START, "subNode1")
    .addEdge("subNode1", "subNode2")
    .addEdge("subNode2", END)
    .compile();

// Использование подграфа как узла в основном графе
const mainGraph = new StateGraph(MainState)
    .addNode("preprocess", preprocessNode)
    .addNode("subgraph", subgraph) // Подграф как узел
    .addNode("postprocess", postprocessNode)
    .addEdge(START, "preprocess")
    .addEdge("preprocess", "subgraph")
    .addEdge("subgraph", "postprocess")
    .addEdge("postprocess", END)
    .compile();
```

#### Вызов подграфа как функции

Подграфы можно вызывать как обычные функции внутри узлов:

```typescript
async function parentNode(state: ParentState) {
    // Вызвать подграф как функцию
    const subgraphResult = await subgraph.invoke({
        input: state.data
    });
    
    // Использовать результат подграфа
    return {
        processedData: subgraphResult.output
    };
}

const mainGraph = new StateGraph(ParentState)
    .addNode("parent", parentNode)
    .addEdge(START, "parent")
    .addEdge("parent", END)
    .compile();
```

#### Подграфы с разными состояниями

Подграфы могут иметь свое собственное состояние, отличное от родительского графа:

```typescript
// Состояние подграфа
const SubState = z.object({
    input: z.string(),
    output: z.string(),
});

// Состояние родительского графа
const ParentState = z.object({
    data: z.string(),
    result: z.string(),
});

const subgraph = new StateGraph(SubState)
    .addNode("process", async (state) => {
        return { output: `Обработано: ${state.input}` };
    })
    .addEdge(START, "process")
    .addEdge("process", END)
    .compile();

async function parentNode(state: ParentState) {
    // Преобразовать состояние родителя в состояние подграфа
    const subResult = await subgraph.invoke({
        input: state.data
    });
    
    // Преобразовать результат подграфа обратно в состояние родителя
    return {
        result: subResult.output
    };
}
```

#### Подграфы с чекпоинтами

Подграфы могут иметь свои собственные чекпоинтеры:

```typescript
const subgraphCheckpointer = new MemorySaver();

const subgraph = new StateGraph(SubState)
    .addNode("process", processNode)
    .addEdge(START, "process")
    .addEdge("process", END)
    .compile({
        checkpointer: subgraphCheckpointer,
    });

// При вызове подграфа можно передать конфигурацию
async function parentNode(state: ParentState, runtime: Runtime) {
    const subResult = await subgraph.invoke(
        { input: state.data },
        {
            configurable: {
                thread_id: `${runtime.context?.thread_id}-sub`
            }
        }
    );
    
    return { result: subResult.output };
}
```

#### Прерывания в подграфах

Когда подграф вызывается как функция и содержит прерывание, родительский граф также приостанавливается:

```typescript
async function nodeInParentGraph(state: State) {
    someCode(); // <-- Это будет повторно выполняться при возобновлении
    
    // Вызвать подграф как функцию.
    // Подграф содержит вызов `interrupt`.
    const subgraphResult = await subgraph.invoke(someInput);
    
    // ...
}

async function nodeInSubgraph(state: State) {
    someOtherCode(); // <-- Это также будет повторно выполняться при возобновлении
    const result = interrupt("Как вас зовут?");
    // ...
}
```

#### Переиспользование подграфов

Подграфы можно переиспользовать в разных местах:

```typescript
// Общий подграф для обработки данных
const dataProcessor = new StateGraph(DataState)
    .addNode("validate", validateNode)
    .addNode("transform", transformNode)
    .addEdge(START, "validate")
    .addEdge("validate", "transform")
    .addEdge("transform", END)
    .compile();

// Использование в разных графах
const graph1 = new StateGraph(State1)
    .addNode("preprocess", preprocessNode)
    .addNode("process", async (state) => {
        return await dataProcessor.invoke(state.data);
    })
    .addEdge(START, "preprocess")
    .addEdge("preprocess", "process")
    .addEdge("process", END)
    .compile();

const graph2 = new StateGraph(State2)
    .addNode("process", async (state) => {
        return await dataProcessor.invoke(state.data);
    })
    .addEdge(START, "process")
    .addEdge("process", END)
    .compile();
```

#### Лучшие практики для подграфов

- **Модульность**: Разбивайте сложную логику на логические подграфы
- **Переиспользование**: Создавайте общие подграфы для повторяющихся паттернов
- **Изоляция состояния**: Используйте отдельные состояния для подграфов
- **Документация**: Документируйте входы и выходы подграфов
- **Тестирование**: Тестируйте подграфы независимо от родительских графов

---

## Production готовность

### Структура приложения

Рекомендуемая структура для production приложений:

```
project/
├── src/
│   ├── agents/
│   │   ├── calculator.ts      # Определение агента
│   │   └── index.ts
│   ├── nodes/
│   │   ├── llm.ts             # Узлы графа
│   │   └── tools.ts
│   ├── state/
│   │   └── schema.ts          # Определение состояния
│   ├── tools/
│   │   └── calculator.ts      # Инструменты
│   ├── checkpoints/
│   │   └── setup.ts           # Настройка чекпоинтеров
│   └── index.ts
├── tests/
│   └── agents.test.ts
└── package.json
```

### Тестирование

#### Базовое тестирование

```typescript
import { describe, it, expect } from "@jest/globals";
import { graph } from "../src/agents/calculator";
import { HumanMessage } from "@langchain/core/messages";

describe("Calculator Agent", () => {
  it("should add two numbers", async () => {
    const result = await graph.invoke({
      messages: [new HumanMessage("Add 3 and 4")],
    });

    expect(result.messages).toHaveLength(3); // user, ai, tool
    const lastMessage = result.messages[result.messages.length - 1];
    expect(lastMessage.content).toContain("7");
  });

  it("should handle errors gracefully", async () => {
    const result = await graph.invoke({
      messages: [new HumanMessage("Divide 10 by 0")],
    });

    expect(result.messages[result.messages.length - 1].content).toContain("error");
  });
});
```

#### Тестирование с моками

```typescript
import { jest } from "@jest/globals";

// Мок для LLM
const mockLLM = {
  invoke: jest.fn().mockResolvedValue({
    content: "Mocked response",
    tool_calls: [],
  }),
};

// Тест с моком
it("should use mocked LLM", async () => {
  const result = await graph.invoke(
    { messages: [new HumanMessage("test")] },
    { llm: mockLLM }
  );
  
  expect(mockLLM.invoke).toHaveBeenCalled();
});
```

### Обработка ошибок

```typescript
const workflow = new StateGraph(State)
  .addNode("safe", async (state) => {
    try {
      // Потенциально опасная операция
      const result = await riskyOperation(state);
      return { result };
    } catch (error) {
      // Логирование ошибки
      console.error("Error in safe node:", error);
      
      // Возврат состояния ошибки
      return {
        error: error.message,
        errorType: error.constructor.name,
      };
    }
  })
  .addConditionalEdges(
    "safe",
    (state) => state.error ? "handleError" : "continue",
    {
      handleError: "errorHandler",
      continue: "nextNode",
    }
  );
```

### Логирование и мониторинг

```typescript
import { LangChainTracer } from "langchain/callbacks";

const tracer = new LangChainTracer({
  projectName: "my-agent",
});

const graph = workflow.compile({
  callbacks: [tracer],
});

// Выполнение с трейсингом
await graph.invoke(
  { messages: [new HumanMessage("test")] },
  {
    configurable: { thread_id: "thread1" },
    callbacks: [tracer],
  }
);
```

### Оптимизация производительности

#### Кэширование

```typescript
import { InMemoryCache } from "@langchain/core/caches";

const cache = new InMemoryCache();

const model = new ChatOpenAI({
  cache,
  temperature: 0,
});
```

#### Параллельное выполнение

```typescript
// Узлы, которые могут выполняться параллельно
const workflow = new StateGraph(State)
  .addNode("fetch1", fetchData1)
  .addNode("fetch2", fetchData2)
  .addNode("fetch3", fetchData3)
  .addEdge(START, "fetch1")
  .addEdge(START, "fetch2") // Параллельно
  .addEdge(START, "fetch3")  // Параллельно
  .addNode("combine", combineResults)
  .addEdge("fetch1", "combine")
  .addEdge("fetch2", "combine")
  .addEdge("fetch3", "combine");
```

### Безопасность

```typescript
// Валидация входных данных
const State = z.object({
  messages: z.array(z.any()),
  userId: z.string().min(1).max(100),
});

// Санитизация входных данных
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "");
}

// Ограничение размера состояния
const MAX_STATE_SIZE = 10000;
if (JSON.stringify(state).length > MAX_STATE_SIZE) {
  throw new Error("State too large");
}
```

---

## Дополнительные ресурсы

- Официальная документация: https://docs.langchain.com/oss/javascript/langgraph
- GitHub репозиторий: https://github.com/langchain-ai/langgraphjs
- Примеры использования: https://github.com/langchain-ai/langgraphjs/tree/main/examples

---

## Заключение

LangGraph.js предоставляет мощный и гибкий инструментарий для создания сложных AI-агентов с поддержкой памяти, условной логики и визуализации. Используйте эту документацию как справочник при разработке ваших приложений.

---

*Документация переведена и адаптирована на русский язык. Для получения самой актуальной информации обращайтесь к официальной документации.*

