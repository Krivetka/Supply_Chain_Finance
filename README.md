# Supply Chain Finance — Senior Angular Take-Home

Тестовое задание. Задание: `Senior-Angular-Take-Home.docx` в корне.

## Статус

| Часть | Файл(ы) | Статус |
|-------|---------|--------|
| Part 1 — Код фичи (Nx libs, SignalStore, feature) | `libs/` | ⏳ не сделано (запланирован отдельным этапом) |
| Part 2 — Architecture notes | `ARCHITECTURE.md` | ⏳ каркас |
| Part 3 — Review & refactor | `REVIEW.md`, `legacy/`, `refactor/` | ⏳ каркас |
| Part 4 — Security | `SECURITY.md` | ⏳ каркас |

## Порядок чтения

Автор задания сам подсказал в разделе Submitting порядок, наиболее информативный для ревьюера:

1. **`REVIEW.md`** — Part 3, ревью legacy-компонента + два фикса в `refactor/`.
2. **`ARCHITECTURE.md`** — Part 2, обоснования архитектурных решений.
3. **`libs/`** — Part 1, тонкий вертикальный срез фичи *(будет добавлен)*.
4. **`SECURITY.md`** — Part 4, короткие ответы.

## Структура репозитория

```
.
├── README.md                        # этот файл
├── ARCHITECTURE.md                  # Part 2
├── REVIEW.md                        # Part 3
├── SECURITY.md                      # Part 4
├── Senior-Angular-Take-Home.docx    # оригинальное задание
├── legacy/
│   └── invoice-list.component.ts    # оригинал из задания, референс "до"
└── refactor/
    └── invoice-list.component.ts    # фикс двух худших проблем (reference-quality)
```

## Как запустить

Part 1 (Angular workspace) ещё не поднят, поэтому команд `npm install` / `ng serve` пока нет.
Файлы в `refactor/` — reference-quality: они должны *читаться* как валидный Angular-код, но не запускаются как есть. Когда появится Part 1 workspace, эти файлы можно будет туда положить и запустить.

## Boundary setup (превью для Part 1)

Планируемая DDD-раскладка:

```
libs/
  invoicing/
    domain/         type:util          — типы, VO, чистая логика (ничего не импортит)
    data-access/    type:data-access   — Apollo, SignalStore, mappers (может domain)
    feature-list/   type:feature       — smart-контейнеры (может data-access, ui, domain)
    ui/             type:ui            — dumb-компоненты (только domain)
  auth/
    data-access/    type:data-access   — current user + permissions
```

Правила `@nx/enforce-module-boundaries`:
- `type:ui` → только `type:util`
- `type:feature` → `data-access`, `ui`, `util`
- `type:data-access` → `util`
- `type:util` → ничего

## State ownership decision

- **Инвойсы, фильтры, request-status** → `invoicing/data-access` SignalStore. Домен-локальный стейт, слепок сервер-стейта, живёт рядом с Apollo.
- **Текущий юзер + permissions** → `auth/data-access` (отдельный SignalStore). Cross-cutting, но не global NgRx — переусложнение для одной фичи. Обоснование в `ARCHITECTURE.md`.
- **Локальный UI-стейт (открытие dropdown и т.п.)** → `signal()` в компоненте.
