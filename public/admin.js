// Функционал админ-панели
class AdminPanel {
  constructor() {
    this.config = {};
    this.init();
  }

  async init() {
    this.setupTabs();
    this.setupEventListeners();
    await this.loadConfig();
    await this.loadStatus();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Убираем активные классы
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Добавляем активные классы
        button.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
      });
    });
  }

  setupEventListeners() {
    // Проверка Bot Token
    document.getElementById('validateTokenBtn').addEventListener('click', () => {
      this.validateBotToken();
    });

    // Поиск Chat ID
    document.getElementById('findChatBtn').addEventListener('click', () => {
      this.findChatId();
    });

    // Тест отправки сообщения
    document.getElementById('testMessageBtn').addEventListener('click', () => {
      this.testMessage();
    });

    // Сохранение конфигурации
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
      this.saveConfig();
    });

    // Обновление статуса
    document.getElementById('refreshStatusBtn').addEventListener('click', () => {
      this.loadStatus();
    });

    // Выбор/снятие всех валютных пар
    document.getElementById('selectAllPairs').addEventListener('click', () => {
      this.selectAllPairs(true);
    });

    document.getElementById('deselectAllPairs').addEventListener('click', () => {
      this.selectAllPairs(false);
    });
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      
      if (data.success) {
        this.config = data.config;
        this.populateForm();
      } else {
        this.showAlert('danger', 'Ошибка загрузки конфигурации: ' + data.error);
      }
    } catch (error) {
      this.showAlert('danger', 'Ошибка подключения: ' + error.message);
    }
  }

  populateForm() {
    // Заполняем поля формы
    document.getElementById('telegramBotToken').value = this.config.telegramBotToken || '';
    document.getElementById('telegramChatId').value = this.config.telegramChatId || '';
    document.getElementById('bybitApiKey').value = this.config.bybitApiKey || '';
    document.getElementById('bybitSecretKey').value = this.config.bybitSecretKey || '';
    document.getElementById('analysisInterval').value = this.config.analysisInterval || '4h';

    // Заполняем чекбоксы валютных пар
    const selectedPairs = this.config.analysisPairs || [];
    const checkboxes = document.querySelectorAll('input[name="analysisPairs"]');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectedPairs.includes(checkbox.value);
    });
  }

  async validateBotToken() {
    const token = document.getElementById('telegramBotToken').value.trim();
    
    if (!token) {
      this.showAlert('warning', 'Введите Bot Token');
      return;
    }

    this.showLoading('tokenValidationResult');

    try {
      const response = await fetch('/api/admin/telegram/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token })
      });

      const data = await response.json();
      this.hideLoading('tokenValidationResult');

      if (data.valid) {
        this.showAlert('success', `✅ Token валиден! Бот: @${data.botInfo.username}`, 'tokenValidationResult');
      } else {
        this.showAlert('danger', `❌ ${data.error}`, 'tokenValidationResult');
      }
    } catch (error) {
      this.hideLoading('tokenValidationResult');
      this.showAlert('danger', 'Ошибка проверки: ' + error.message, 'tokenValidationResult');
    }
  }

  async findChatId() {
    const token = document.getElementById('telegramBotToken').value.trim();
    
    if (!token) {
      this.showAlert('warning', 'Сначала введите и проверьте Bot Token');
      return;
    }

    this.showLoading('chatIdResult');

    try {
      const response = await fetch('/api/admin/telegram/find-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token })
      });

      const data = await response.json();
      this.hideLoading('chatIdResult');

      if (data.found) {
        document.getElementById('telegramChatId').value = data.chatId;
        this.showAlert('success', `✅ Chat ID найден: ${data.chatId}`, 'chatIdResult');
      } else {
        this.showAlert('warning', `⚠️ ${data.error}`, 'chatIdResult');
      }
    } catch (error) {
      this.hideLoading('chatIdResult');
      this.showAlert('danger', 'Ошибка поиска: ' + error.message, 'chatIdResult');
    }
  }

  async testMessage() {
    const token = document.getElementById('telegramBotToken').value.trim();
    const chatId = document.getElementById('telegramChatId').value.trim();
    
    if (!token || !chatId) {
      this.showAlert('warning', 'Введите Bot Token и Chat ID');
      return;
    }

    this.showLoading('testMessageResult');

    try {
      const response = await fetch('/api/admin/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token, chatId: chatId })
      });

      const data = await response.json();
      this.hideLoading('testMessageResult');

      if (data.success) {
        this.showAlert('success', '✅ Тестовое сообщение отправлено!', 'testMessageResult');
      } else {
        this.showAlert('danger', `❌ ${data.error}`, 'testMessageResult');
      }
    } catch (error) {
      this.hideLoading('testMessageResult');
      this.showAlert('danger', 'Ошибка отправки: ' + error.message, 'testMessageResult');
    }
  }

  async saveConfig() {
    const config = {
      telegramBotToken: document.getElementById('telegramBotToken').value.trim(),
      telegramChatId: document.getElementById('telegramChatId').value.trim(),
      bybitApiKey: document.getElementById('bybitApiKey').value.trim(),
      bybitSecretKey: document.getElementById('bybitSecretKey').value.trim(),
      analysisInterval: document.getElementById('analysisInterval').value,
      analysisPairs: Array.from(document.querySelectorAll('input[name="analysisPairs"]:checked'))
        .map(cb => cb.value)
    };

    // Валидация
    if (!config.telegramBotToken || !config.telegramChatId) {
      this.showAlert('warning', 'Telegram Bot Token и Chat ID обязательны');
      return;
    }

    if (config.analysisPairs.length === 0) {
      this.showAlert('warning', 'Выберите хотя бы одну валютную пару');
      return;
    }

    this.showLoading('saveConfigResult');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      this.hideLoading('saveConfigResult');

      if (data.success) {
        this.config = config;
        this.showAlert('success', '✅ Конфигурация сохранена!', 'saveConfigResult');
      } else {
        this.showAlert('danger', `❌ ${data.error}`, 'saveConfigResult');
      }
    } catch (error) {
      this.hideLoading('saveConfigResult');
      this.showAlert('danger', 'Ошибка сохранения: ' + error.message, 'saveConfigResult');
    }
  }

  async loadStatus() {
    this.showLoading('systemStatus');

    try {
      const response = await fetch('/api/admin/status');
      const data = await response.json();
      
      this.hideLoading('systemStatus');

      if (data.success) {
        this.displayStatus(data.status);
      } else {
        this.showAlert('danger', 'Ошибка загрузки статуса: ' + data.error, 'systemStatus');
      }
    } catch (error) {
      this.hideLoading('systemStatus');
      this.showAlert('danger', 'Ошибка подключения: ' + error.message, 'systemStatus');
    }
  }

  displayStatus(status) {
    const statusHtml = `
      <div class="status-card">
        <h4>📊 Кеш данных</h4>
        <p><strong>Состояние:</strong> ${status.cache.hasData ? '✅ Данные доступны' : '❌ Нет данных'}</p>
        ${status.cache.lastUpdate ? `<p><strong>Последнее обновление:</strong> ${new Date(status.cache.lastUpdate).toLocaleString()}</p>` : ''}
        ${status.cache.dataAge !== null ? `<p><strong>Возраст данных:</strong> ${status.cache.dataAge} мин.</p>` : ''}
        <p><strong>Количество анализов:</strong> ${status.cache.analysisCount}</p>
      </div>
      
      <div class="status-card">
        <h4>🖥️ Система</h4>
        <p><strong>Время работы:</strong> ${Math.round(status.system.uptime)} сек.</p>
        <p><strong>Используется памяти:</strong> ${Math.round(status.system.memory.used / 1024 / 1024)} МБ</p>
        <p><strong>Версия Node.js:</strong> ${status.system.version}</p>
      </div>
      
      <div class="status-card">
        <h4>⏱️ Последняя проверка</h4>
        <p>${new Date(status.timestamp).toLocaleString()}</p>
      </div>
    `;
    
    document.getElementById('systemStatus').innerHTML = statusHtml;
  }

  selectAllPairs(select) {
    const checkboxes = document.querySelectorAll('input[name="analysisPairs"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = select;
    });
  }

  showAlert(type, message, containerId = 'alerts') {
    const container = document.getElementById(containerId);
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }

  showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="loading">Загрузка...</div>';
  }

  hideLoading(containerId) {
    // Метод будет заменен на результат
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
