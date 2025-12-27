#!/bin/bash

# Скрипт для запуска Ollama LangGraph Agent

echo "🚀 Запуск Ollama LangGraph Agent..."
echo ""

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 18+"
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Пожалуйста, установите npm"
    exit 1
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
    echo ""
fi

# Проверка работы Ollama
echo "🔍 Проверка Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama работает"
else
    echo "⚠️  Внимание: Ollama не отвечает на http://localhost:11434"
    echo "   Убедитесь, что Ollama запущен: ollama serve"
    echo ""
    read -p "Продолжить запуск? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎯 Запуск приложения..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запуск приложения
npm run dev

