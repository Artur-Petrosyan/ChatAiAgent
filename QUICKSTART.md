# Quick Start

## Requirements

- Node.js 18+
- Ollama installed and running
- Ollama model (e.g., mistral, llama3.2, llama3.1, etc.)

## Installation and Launch

### Windows (PowerShell)

```powershell
# 1. Install dependencies
npm install

# 2. Check Ollama (in a separate terminal)
# Make sure Ollama is running:
# ollama serve

# 3. Run the application
npm run dev
```

### Linux/Mac (Bash)

```bash
# 1. Make script executable (if needed)
chmod +x start.sh

# 2. Run via script
./start.sh

# Or manually:
npm install
npm run dev
```

## Usage

1. Open browser: http://localhost:3000
2. Enter your question in the input field
3. Press "Send" or Enter

## Ollama Model Configuration

If you have a different model, edit `src/agent/nodes.ts`:

```typescript
const model = new ChatOllama({
  model: "your-model", // For example: "llama3.1", "mistral", "codellama"
});
```

## Checking Ollama

```bash
# Check available models
ollama list

# Check if Ollama is working
curl http://localhost:11434/api/tags
```

## Troubleshooting

### Ollama not responding

```bash
# Run Ollama in a separate terminal
ollama serve
```

### Port already in use

Change ports in:
- `vite.config.ts` (frontend)
- `src/server/index.ts` (backend)

### Installation errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

# Быстрый старт

## Требования

- Node.js 18+ 
- Ollama установлен и запущен
- Модель Ollama (например, mistral, llama3.2, llama3.1 и т.д.)

## Установка и запуск

### Windows (PowerShell)

```powershell
# 1. Установка зависимостей
npm install

# 2. Проверка Ollama (в отдельном терминале)
# Убедитесь, что Ollama запущен:
# ollama serve

# 3. Запуск приложения
npm run dev
```

### Linux/Mac (Bash)

```bash
# 1. Сделать скрипт исполняемым (если нужно)
chmod +x start.sh

# 2. Запуск через скрипт
./start.sh

# Или вручную:
npm install
npm run dev
```

## Использование

1. Откройте браузер: http://localhost:3000
2. Введите вопрос в поле ввода
3. Нажмите "Отправить" или Enter

## Настройка модели Ollama

Если у вас другая модель, отредактируйте `src/agent/nodes.ts`:

```typescript
const model = new ChatOllama({
  model: "ваша-модель", // Например: "llama3.1", "mistral", "codellama"
});
```

## Проверка работы Ollama

```bash
# Проверить доступные модели
ollama list

# Проверить, что Ollama работает
curl http://localhost:11434/api/tags
```

## Устранение проблем

### Ollama не отвечает

```bash
# Запустите Ollama в отдельном терминале
ollama serve
```

### Порт занят

Измените порты в:
- `vite.config.ts` (фронтенд)
- `src/server/index.ts` (бэкенд)

### Ошибки при установке

```bash
# Очистить кэш и переустановить
rm -rf node_modules package-lock.json
npm install
```
