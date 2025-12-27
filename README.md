# Ollama LangGraph Agent

A simple AI agent built with LangGraph.js and Ollama with a React + Vite web interface.

## 🚀 Quick Start

### Requirements

- Node.js 18+
- Ollama installed and running locally
- Ollama model (e.g., mistral)

### Installation

```bash
# Install dependencies
npm install

# Run in development mode (server and client simultaneously)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Ollama Setup

Make sure Ollama is running:

```bash
# Check Ollama status
curl http://localhost:11434/api/tags
```

To change the model, edit `src/agent/nodes.ts`:

```typescript
const model = new ChatOllama({
  model: "your-model", // Change here
});
```

## 📁 Project Structure

```
├── src/
│   ├── agent/          # LangGraph agent logic
│   │   ├── state.ts     # State definition
│   │   ├── nodes.ts     # Graph nodes
│   │   └── graph.ts     # Graph assembly
│   ├── server/          # Express server
│   │   └── index.ts     # API endpoints
│   ├── App.tsx          # React component
│   └── main.tsx         # Entry point
├── package.json
└── vite.config.ts
```

## 🛠️ Usage

1. Run `npm run dev`
2. Open http://localhost:3000
3. Ask the agent a question in the interface

## 📝 API

### POST /api/chat

Send a message to the agent.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing great, thank you!",
  "llmCalls": 1,
  "sessionId": "session-id"
}
```

### GET /api/health

Check server status.

## 🔧 Development

- `npm run dev` - run in development mode
- `npm run build` - build for production
- `npm run preview` - preview production build

## 📚 Technologies

- **LangGraph.js** - AI agent orchestration
- **Ollama** - local LLM
- **React** - UI framework
- **Vite** - build tool
- **Express** - backend server
- **TypeScript** - type safety

---

# Ollama LangGraph Agent

Простой AI-агент на базе LangGraph.js и Ollama с веб-интерфейсом на React + Vite.

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- Ollama установлен и запущен локально
- Модель Ollama (например, mistral)

### Установка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки (одновременно сервер и клиент)
npm run dev
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Настройка Ollama

Убедитесь, что Ollama запущен:

```bash
# Проверка статуса Ollama
curl http://localhost:11434/api/tags
```

Если нужно изменить модель, отредактируйте `src/agent/nodes.ts`:

```typescript
const model = new ChatOllama({
  model: "ваша-модель", // Измените здесь
});
```

## 📁 Структура проекта

```
├── src/
│   ├── agent/          # Логика LangGraph агента
│   │   ├── state.ts     # Определение состояния
│   │   ├── nodes.ts     # Узлы графа
│   │   └── graph.ts     # Сборка графа
│   ├── server/          # Express сервер
│   │   └── index.ts     # API endpoints
│   ├── App.tsx          # React компонент
│   └── main.tsx         # Точка входа
├── package.json
└── vite.config.ts
```

## 🛠️ Использование

1. Запустите `npm run dev`
2. Откройте http://localhost:3000
3. Задайте вопрос агенту в интерфейсе

## 📝 API

### POST /api/chat

Отправка сообщения агенту.

**Запрос:**
```json
{
  "message": "Привет, как дела?"
}
```

**Ответ:**
```json
{
  "response": "Привет! У меня всё отлично, спасибо!",
  "llmCalls": 1,
  "sessionId": "session-id"
}
```

### GET /api/health

Проверка статуса сервера.

## 🔧 Разработка

- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка для production
- `npm run preview` - предпросмотр production сборки

## 📚 Технологии

- **LangGraph.js** - оркестрация AI-агента
- **Ollama** - локальная LLM
- **React** - UI фреймворк
- **Vite** - сборщик
- **Express** - backend сервер
- **TypeScript** - типизация
