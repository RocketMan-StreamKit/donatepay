# DonatePay

[English](#english) | [Русский](#русский) | [Українська](#українська)

## English

### For users

DonatePay integration: API key auth and real-time donation alerts via Centrifugo WebSocket.

**Install:** Settings → Addons → Install from folder (or drag-and-drop the folder/zip into the app window).

### For developers

This addon is a **TypeScript worker** integration. Entry point: `index.ts` (compiled to `index.js`).

**Local build**

```bash
npm install
npm run build
```

Install the `dist/` folder contents (or the release zip) via StreamKit+ settings.

**Dependencies**

- [`@rocketman-streamkit/types`](https://www.npmjs.com/package/@rocketman-streamkit/types) — sandbox API typings
- [Addon developer docs](https://github.com/RocketMan-StreamKit/types)

**Manifest**

| Field | Value |
| --- | --- |
| Type | `platform.donation` |
| Permissions | NETWORK_REQUEST, NETWORK_WEBSOCKET, DASHBOARD_EVENTS, STATUS, NOTIFY |

## Русский

### Для пользователей

Интеграция DonatePay: авторизация по API ключу и донаты в реальном времени через Centrifugo WebSocket.

**Установка:** Настройки → Аддоны → Установить из папки (или перетащите папку/zip в окно приложения).

### Для разработчиков

Аддон — **TypeScript worker**. Точка входа: `index.ts` (собирается в `index.js`).

**Локальная сборка**

```bash
npm install
npm run build
```

Установите содержимое `dist/` (или zip из релиза) через настройки StreamKit+.

**Зависимости**

- [`@rocketman-streamkit/types`](https://www.npmjs.com/package/@rocketman-streamkit/types) — типы sandbox API
- [Документация для разработчиков](https://github.com/RocketMan-StreamKit/types)

**Манифест**

| Поле | Значение |
| --- | --- |
| Тип | `platform.donation` |
| Права | NETWORK_REQUEST, NETWORK_WEBSOCKET, DASHBOARD_EVENTS, STATUS, NOTIFY |

## Українська

### Для користувачів

Інтеграція DonatePay: авторизація за API ключем та донати в реальному часі через Centrifugo WebSocket.

**Встановлення:** Налаштування → Аддони → Встановити з папки (або перетягніть папку/zip у вікно програми).

### Для розробників

Аддон — **TypeScript worker**. Вхідна точка: `index.ts` (збирається в `index.js`).

**Локальна збірка**

```bash
npm install
npm run build
```

Встановіть вміст `dist/` (або zip з релізу) через налаштування StreamKit+.

**Залежності**

- [`@rocketman-streamkit/types`](https://www.npmjs.com/package/@rocketman-streamkit/types) — типи sandbox API
- [Документація для розробників](https://github.com/RocketMan-StreamKit/types)

**Маніфест**

| Поле | Значення |
| --- | --- |
| Тип | `platform.donation` |
| Права | NETWORK_REQUEST, NETWORK_WEBSOCKET, DASHBOARD_EVENTS, STATUS, NOTIFY |

