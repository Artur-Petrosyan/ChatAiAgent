# Быстрый старт

## Требования

- Node.js 18+ 
- Ollama установлен и запущен
- Модель Ollama (например, llama3.2, llama3.1, mistral и т.д.)

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

