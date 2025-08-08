# ArcoSquire-back

Backend for ArcoMage card game with Socket.io real-time communication

## Возможности

- ✅ Создание комнат с 4-значными hex ID
- ✅ Подключение игроков к комнатам
- ✅ Real-time обмен данными между игроками
- ✅ Управление ресурсами (5 чисел)
- ✅ Автоматическая очистка пустых комнат
- ✅ REST API для управления комнатами

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите сервер:
```bash
npm start
```

Для разработки с автоматической перезагрузкой:
```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3001`

## API Endpoints

### REST API

- `GET /api/rooms` - Получить список всех комнат
- `POST /api/rooms` - Создать новую комнату
- `GET /api/rooms/:roomId` - Получить информацию о комнате

### Socket.io Events

#### Клиент → Сервер
- `join-room` - Присоединиться к комнате
- `update-resources` - Обновить ресурсы игрока
- `get-game-state` - Запросить состояние игры
- `get-opponent-resources` - Запросить ресурсы противника

#### Сервер → Клиент
- `room-joined` - Подтверждение присоединения к комнате
- `player-joined` - Новый игрок присоединился
- `game-started` - Игра началась (оба игрока подключены)
- `resources-updated` - Ресурсы игрока обновлены (отправляется только другим игрокам)
- `room-full` - Комната заполнена (третий игрок пытается присоединиться)
- `player-left` - Игрок покинул комнату
- `game-state` - Состояние игры (ответ на запрос)
- `opponent-resources` - Ресурсы противника (ответ на запрос)
- `error` - Ошибка

## Тестирование

Откройте `http://localhost:3001/test.html` в браузере для тестирования функциональности.

## Структура проекта

```
arco-backend/
├── server.js          # Основной файл сервера
├── src/
│   └── roomManager.js # Управление комнатами и игроками
├── public/
│   └── test.html      # Тестовая страница
├── package.json
└── README.md
```

## Пример использования

### Создание комнаты
```javascript
const response = await fetch('/api/rooms', {
  method: 'POST'
});
const { roomId } = await response.json();
```

### Подключение к комнате через Socket.io
```javascript
const socket = io();
socket.emit('join-room', 'A1B2');
```

### Обновление ресурсов
```javascript
socket.emit('update-resources', {
  roomId: 'A1B2',
  resources: [10, 5, 3, 7, 2]
});
```

### Запрос состояния игры
```javascript
socket.emit('get-game-state', {
  roomId: 'A1B2'
});

// Ответ будет содержать:
// {
//   players: ["player1_id", "player2_id"],
//   opponentResources: [10, 5, 3, 7, 2],
//   roomId: "A1B2"
// }
```

### Запрос ресурсов противника
```javascript
socket.emit('get-opponent-resources', {
  roomId: 'A1B2'
});

// Ответ будет содержать:
// {
//   roomId: "A1B2",
//   resources: [10, 5, 3, 7, 2]
// }
```

## Формат данных

Ресурсы передаются как массив из 5 чисел (диапазон 0-50):
```javascript
[resource1, resource2, resource3, resource4, resource5]
```

Каждый ресурс должен быть в диапазоне от 0 до 50.

## Лимиты

- Максимум 2 игрока в комнате
- Игра начинается только когда оба игрока подключены
- Ресурсы ограничены диапазоном 0-50
- Комнаты автоматически удаляются при выходе всех игроков
- ID комнат генерируются как 4-значные hex коды
