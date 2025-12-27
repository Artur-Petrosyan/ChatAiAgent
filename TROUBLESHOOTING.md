# Troubleshooting

## Error: "Error sending message"

### 1. Check that Ollama is running

```bash
# Check Ollama status
curl http://localhost:11434/api/tags
```

If Ollama is not responding:
```bash
# Run Ollama in a separate terminal
ollama serve
```

### 2. Check that the model is installed

```bash
# List installed models
ollama list

# If model is not installed, install it:
ollama pull mistral
# or another model:
ollama pull llama3.1
ollama pull llama3.2
```

### 3. Check model settings in code

Open `src/agent/nodes.ts` and make sure the model name matches the installed one:

```typescript
const model = new ChatOllama({
  model: "mistral", // Change to your model
});
```

### 4. Check that the server is running

```bash
# Check API server
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok","service":"Ollama LangGraph Agent"}`

### 5. Check server logs

In the terminal where `npm run dev` is running, you should see error logs. Look for messages like:
- "Error in llmNode"
- "Error processing request"

### 6. Common errors

#### "ECONNREFUSED" or "Cannot connect to Ollama"
- **Cause**: Ollama is not running
- **Solution**: Run `ollama serve` in a separate terminal

#### "Model not found"
- **Cause**: Model is not installed or name doesn't match
- **Solution**: Install the model `ollama pull mistral` or change the name in code

#### "Port 3001 already in use"
- **Cause**: Port is occupied by another process
- **Solution**: Change the port in `src/server/index.ts` or stop the process on port 3001

#### "Cannot find module '@langchain/community'"
- **Cause**: Dependencies are not installed
- **Solution**: Run `npm install`

## Checking Operation

1. **Check Ollama:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Check API server:**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Test request:**
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello!"}'
   ```

## Logs and Debugging

Enable detailed logging by adding to `src/server/index.ts`:

```typescript
console.log("Request body:", req.body);
console.log("Agent result:", result);
```

In `src/agent/nodes.ts`:

```typescript
console.log("State:", state);
console.log("Model response:", response);
```

## Getting Help

If the problem is not resolved:
1. Check logs in browser console (F12)
2. Check server logs in terminal
3. Make sure all dependencies are installed: `npm install`
4. Try restarting: stop the process (Ctrl+C) and run again `npm run dev`

---

# Устранение проблем

## Ошибка: "Ошибка при отправке сообщения"

### 1. Проверьте, что Ollama запущен

```bash
# Проверка статуса Ollama
curl http://localhost:11434/api/tags
```

Если Ollama не отвечает:
```bash
# Запустите Ollama в отдельном терминале
ollama serve
```

### 2. Проверьте, что модель установлена

```bash
# Список установленных моделей
ollama list

# Если модель не установлена, установите её:
ollama pull mistral
# или другую модель:
ollama pull llama3.1
ollama pull llama3.2
```

### 3. Проверьте настройки модели в коде

Откройте `src/agent/nodes.ts` и убедитесь, что имя модели совпадает с установленной:

```typescript
const model = new ChatOllama({
  model: "mistral", // Измените на вашу модель
});
```

### 4. Проверьте, что сервер запущен

```bash
# Проверка API сервера
curl http://localhost:3001/api/health
```

Должен вернуться: `{"status":"ok","service":"Ollama LangGraph Agent"}`

### 5. Проверьте логи сервера

В терминале, где запущен `npm run dev`, должны быть видны логи ошибок. Ищите сообщения типа:
- "Ошибка в llmNode"
- "Ошибка при обработке запроса"

### 6. Частые ошибки

#### "ECONNREFUSED" или "Cannot connect to Ollama"
- **Причина**: Ollama не запущен
- **Решение**: Запустите `ollama serve` в отдельном терминале

#### "Model not found"
- **Причина**: Модель не установлена или имя не совпадает
- **Решение**: Установите модель `ollama pull mistral` или измените имя в коде

#### "Port 3001 already in use"
- **Причина**: Порт занят другим процессом
- **Решение**: Измените порт в `src/server/index.ts` или остановите процесс на порту 3001

#### "Cannot find module '@langchain/community'"
- **Причина**: Зависимости не установлены
- **Решение**: Выполните `npm install`

## Проверка работы

1. **Проверка Ollama:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Проверка API сервера:**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Тестовый запрос:**
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Привет!"}'
   ```

## Логи и отладка

Включите детальное логирование, добавив в `src/server/index.ts`:

```typescript
console.log("Request body:", req.body);
console.log("Agent result:", result);
```

В `src/agent/nodes.ts`:

```typescript
console.log("State:", state);
console.log("Model response:", response);
```

## Получение помощи

Если проблема не решена:
1. Проверьте логи в консоли браузера (F12)
2. Проверьте логи сервера в терминале
3. Убедитесь, что все зависимости установлены: `npm install`
4. Попробуйте перезапустить: остановите процесс (Ctrl+C) и запустите снова `npm run dev`
