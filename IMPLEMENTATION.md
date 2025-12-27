# Implementation Documentation for Ollama LangGraph Agent

## Project Overview

A simple AI agent built with LangGraph.js that uses a local LLM via Ollama to answer user questions. The project includes a React + Vite web interface and an Express API server.

## Architecture

### System Components

1. **LangGraph Agent** (`src/agent/`)
   - Graph state definition
   - Nodes for message processing
   - Agent execution graph

2. **Express API Server** (`src/server/`)
   - REST API endpoint for request processing
   - Integration with LangGraph agent

3. **React Frontend** (`src/`)
   - UI for interacting with the agent
   - Sending messages and displaying responses

## Implementation Details

### 1. State Definition (state.ts)

Used Annotation API from LangGraph for state definition:

```typescript
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,  // Built-in annotation for messages
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,   // Reducer for summing calls
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
```

**What was done:**
- Used `MessagesAnnotation` for message handling
- Added `llmCalls` field to track LLM call count
- Added `userMemory` for storing user information
- Defined state type for TypeScript

### 2. Graph Nodes (nodes.ts)

Created nodes for calling LLM via Ollama and extracting user memory:

```typescript
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "mistral",
  temperature: 0.7,
});
```

**What was done:**
- Integrated `ChatOllama` from `@langchain/community`
- Configured system prompt in English
- Node accepts state and returns updated state with LLM response
- Memory extraction node for analyzing user information

### 3. Execution Graph (graph.ts)

Built a graph with LLM node and memory extraction node:

```typescript
export const agentGraph = new StateGraph(AgentState)
  .addNode("llm", llmNode)
  .addNode("extract_memory", extractMemoryNode)
  .addEdge(START, "llm")
  .addEdge("llm", "extract_memory")
  .addEdge("extract_memory", END)
  .compile();
```

**What was done:**
- Used Graph API for explicit graph definition
- Added memory extraction after LLM call
- Graph compiles once when module loads

### 4. Express API Server (server/index.ts)

Created REST API for interacting with the agent:

**Endpoints:**
- `POST /api/chat` - processing user messages
- `GET /api/health` - server status check

**What was done:**
- Configured CORS for frontend
- Error handling with clear messages
- Converting incoming messages to `HumanMessage`
- Extracting response from graph execution result
- Session management

### 5. React Frontend (App.tsx)

Created a simple chat interface:

**Functionality:**
- Displaying message history
- Sending messages via API
- Loading indicator
- Error handling

**What was done:**
- Used React hooks (useState)
- Async API request sending
- Beautiful UI with gradients and animations
- Responsive design

### 6. Project Configuration

**package.json:**
- Installed necessary dependencies:
  - `@langchain/langgraph` - main framework
  - `@langchain/community` - Ollama integration
  - `@langchain/core` - base types and messages
  - `express` - backend server
  - `react`, `vite` - frontend

**vite.config.ts:**
- Configured proxy for API requests
- Port 3000 for frontend
- Proxying `/api` to `localhost:3001`

**tsconfig.json:**
- Configured TypeScript for modern JavaScript
- React JSX support
- Strict type checking mode

## Implementation Features

### Using Annotation API

Instead of the traditional Zod approach, Annotation API was used, as recommended in the documentation:

**Advantages:**
- More modern approach
- Built-in reducer function support
- Easier to work with messages via `MessagesAnnotation`

### Simple Graph Architecture

Chose a simple architecture with LLM node and memory extraction, because:
- Agent doesn't require tools
- No complex conditional logic
- Main task is answering user questions and remembering information

### Ollama Integration

Used `ChatOllama` from `@langchain/community`:
- Support for local models
- Simple configuration via baseUrl
- Compatibility with LangChain messages

## Running and Usage

### Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (server and client simultaneously)
npm run dev

# Server only
npm run dev:server

# Client only
npm run dev:client
```

### Checking Operation

1. Make sure Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Open http://localhost:3000 in browser

3. Send a message to the agent

## Possible Improvements

1. **Adding Tools**
   - Can extend agent with tools for performing actions
   - Use ReAct pattern from documentation

2. **Memory Between Sessions**
   - Add `MemorySaver` for state persistence
   - Use `InMemoryStore` for long-term memory

3. **Streaming**
   - Implement streaming of LLM responses
   - Display tokens in real-time

4. **Error Handling**
   - More detailed Ollama error handling
   - Retry logic for failed requests

5. **Graph Visualization**
   - Add graph structure display
   - Show current execution state

## Conclusion

A working AI agent built with LangGraph.js with Ollama integration. The project follows best practices from the documentation and uses modern approaches (Annotation API). The code is structured, typed, and ready for extension.

---

# Документация по реализации Ollama LangGraph Agent

## Обзор проекта

Создан простой AI-агент на базе LangGraph.js, который использует локальную LLM через Ollama для ответов на вопросы пользователя. Проект включает веб-интерфейс на React + Vite и Express API сервер.

## Архитектура

### Компоненты системы

1. **LangGraph Agent** (`src/agent/`)
   - Определение состояния графа
   - Узлы для обработки сообщений
   - Граф выполнения агента

2. **Express API Server** (`src/server/`)
   - REST API endpoint для обработки запросов
   - Интеграция с LangGraph агентом

3. **React Frontend** (`src/`)
   - UI для взаимодействия с агентом
   - Отправка сообщений и отображение ответов

## Детали реализации

### 1. Определение состояния (state.ts)

Использован Annotation API из LangGraph для определения состояния:

```typescript
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,  // Встроенная аннотация для сообщений
  llmCalls: Annotation<number>({
    reducer: (x, y) => x + y,   // Reducer для суммирования вызовов
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
```

**Что было сделано:**
- Использован `MessagesAnnotation` для работы с сообщениями
- Добавлено поле `llmCalls` для отслеживания количества вызовов LLM
- Добавлена память пользователя `userMemory`
- Определен тип состояния для TypeScript

### 2. Узлы графа (nodes.ts)

Созданы узлы для вызова LLM через Ollama и извлечения памяти пользователя:

```typescript
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "mistral",
  temperature: 0.7,
});
```

**Что было сделано:**
- Интегрирован `ChatOllama` из `@langchain/community`
- Настроен системный промпт на английском языке
- Узел принимает состояние и возвращает обновленное состояние с ответом LLM
- Узел извлечения памяти для анализа информации о пользователе

### 3. Граф выполнения (graph.ts)

Построен граф с узлом LLM и узлом извлечения памяти:

```typescript
export const agentGraph = new StateGraph(AgentState)
  .addNode("llm", llmNode)
  .addNode("extract_memory", extractMemoryNode)
  .addEdge(START, "llm")
  .addEdge("llm", "extract_memory")
  .addEdge("extract_memory", END)
  .compile();
```

**Что было сделано:**
- Использован Graph API для явного определения графа
- Добавлено извлечение памяти после вызова LLM
- Граф компилируется один раз при загрузке модуля

### 4. Express API Server (server/index.ts)

Создан REST API для взаимодействия с агентом:

**Endpoints:**
- `POST /api/chat` - обработка сообщений пользователя
- `GET /api/health` - проверка статуса сервера

**Что было сделано:**
- Настроен CORS для работы с фронтендом
- Обработка ошибок с возвратом понятных сообщений
- Преобразование входящих сообщений в `HumanMessage`
- Извлечение ответа из результата выполнения графа
- Управление сессиями

### 5. React Frontend (App.tsx)

Создан простой чат-интерфейс:

**Функциональность:**
- Отображение истории сообщений
- Отправка сообщений через API
- Индикатор загрузки
- Обработка ошибок

**Что было сделано:**
- Использован React hooks (useState)
- Асинхронная отправка запросов к API
- Красивый UI с градиентами и анимациями
- Адаптивный дизайн

### 6. Конфигурация проекта

**package.json:**
- Установлены необходимые зависимости:
  - `@langchain/langgraph` - основной фреймворк
  - `@langchain/community` - интеграция с Ollama
  - `@langchain/core` - базовые типы и сообщения
  - `express` - backend сервер
  - `react`, `vite` - фронтенд

**vite.config.ts:**
- Настроен прокси для API запросов
- Порт 3000 для фронтенда
- Проксирование `/api` на `localhost:3001`

**tsconfig.json:**
- Настроен TypeScript для современного JavaScript
- Поддержка React JSX
- Строгий режим проверки типов

## Особенности реализации

### Использование Annotation API

Вместо традиционного Zod подхода использован Annotation API, как рекомендовано в документации:

**Преимущества:**
- Более современный подход
- Встроенная поддержка reducer функций
- Проще работать с сообщениями через `MessagesAnnotation`

### Простая архитектура графа

Выбрана простая архитектура с узлом LLM и извлечением памяти, так как:
- Агент не требует инструментов (tools)
- Нет сложной условной логики
- Основная задача - ответ на вопрос пользователя и запоминание информации

### Интеграция с Ollama

Использован `ChatOllama` из `@langchain/community`:
- Поддержка локальных моделей
- Простая настройка через baseUrl
- Совместимость с LangChain сообщениями

## Запуск и использование

### Команды разработки

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки (одновременно сервер и клиент)
npm run dev

# Только сервер
npm run dev:server

# Только клиент
npm run dev:client
```

### Проверка работы

1. Убедитесь, что Ollama запущен:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Откройте http://localhost:3000 в браузере

3. Отправьте сообщение агенту

## Возможные улучшения

1. **Добавление инструментов (tools)**
   - Можно расширить агента инструментами для выполнения действий
   - Использовать паттерн ReAct из документации

2. **Память между сессиями**
   - Добавить `MemorySaver` для сохранения состояния
   - Использовать `InMemoryStore` для долгосрочной памяти

3. **Потоковая передача**
   - Реализовать streaming ответов от LLM
   - Отображать токены в реальном времени

4. **Обработка ошибок**
   - Более детальная обработка ошибок Ollama
   - Retry логика для неудачных запросов

5. **Визуализация графа**
   - Добавить отображение структуры графа
   - Показывать текущее состояние выполнения

## Заключение

Реализован рабочий AI-агент на базе LangGraph.js с интеграцией Ollama. Проект следует лучшим практикам из документации и использует современные подходы (Annotation API). Код структурирован, типизирован и готов к расширению.
