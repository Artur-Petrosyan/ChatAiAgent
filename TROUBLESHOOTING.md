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
ollama pull llama3.2
# или другую модель:
ollama pull llama3.1
ollama pull mistral
```

### 3. Проверьте настройки модели в коде

Откройте `src/agent/nodes.ts` и убедитесь, что имя модели совпадает с установленной:

```typescript
const model = new ChatOllama({
  model: "llama3.2", // Измените на вашу модель
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
- **Решение**: Установите модель `ollama pull llama3.2` или измените имя в коде

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

