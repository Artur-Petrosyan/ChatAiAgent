// Скрипт для проверки работы Ollama
// Использует встроенный fetch (Node.js 18+)

async function checkOllama() {
  console.log('🔍 Проверка Ollama...\n');

  try {
    // Проверка доступности Ollama
    const tagsResponse = await fetch('http://localhost:11434/api/tags');
    
    if (!tagsResponse.ok) {
      throw new Error(`Ollama не отвечает: ${tagsResponse.status} ${tagsResponse.statusText}`);
    }

    const tagsData = await tagsResponse.json();
    console.log('✅ Ollama работает!');
    console.log(`📦 Доступные модели: ${tagsData.models?.length || 0}\n`);

    if (tagsData.models && tagsData.models.length > 0) {
      console.log('Установленные модели:');
      tagsData.models.forEach((model: any) => {
        console.log(`  - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
      });
    } else {
      console.log('⚠️  Модели не найдены. Установите модель:');
      console.log('   ollama pull llama3.2');
    }

    // Проверка конкретной модели
    const modelName = 'llama3.2';
    const hasModel = tagsData.models?.some((m: any) => m.name.includes(modelName));
    
    if (!hasModel) {
      console.log(`\n⚠️  Модель "${modelName}" не найдена.`);
      console.log(`   Установите её: ollama pull ${modelName}`);
    } else {
      console.log(`\n✅ Модель "${modelName}" найдена!`);
    }

  } catch (error: any) {
    console.error('❌ Ошибка при проверке Ollama:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Решение:');
    console.error('   1. Убедитесь, что Ollama запущен: ollama serve');
    console.error('   2. Проверьте, что Ollama доступен на http://localhost:11434');
  }
}

checkOllama();

