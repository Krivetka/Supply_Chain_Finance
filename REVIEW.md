# Code Review — `invoice-list.component.ts` (Part 3)

> Статус: **каркас**. Наполнение — следующий шаг.
> Оригинал: [`legacy/invoice-list.component.ts`](./legacy/invoice-list.component.ts)
> Фиксы: [`refactor/invoice-list.component.ts`](./refactor/invoice-list.component.ts)

## Как читать этот ревью

_TODO: короткое вступление про то, что оценивалось и в каком порядке._

## Blockers (чинить до мёржа)

_TODO: 1-3 пункта. Security / корректность / нарушение контрактов._

## Major (нужно чинить, но можно отдельным PR)

_TODO: 2-4 пункта. Типы, стейт, RxJS-паттерны, DX._

## Minor / cleanup

_TODO: стилистика, dead code, зависимости, тесты._

## Порядок фиксов

_TODO: как я бы разбил на PR-цепочку и почему._

---

## Показательный рефакторинг

Из всех проблем беру две худшие и показываю фикс. Полностью компонент не переписываю — цель показать, что incremental fix возможен без дестабилизации приложения.

### Fix #1: _TODO — title_

_TODO: описание проблемы + ссылка на diff в `refactor/`._

### Fix #2: _TODO — title_

_TODO: описание проблемы + ссылка на diff в `refactor/`._

## Ограничение

Файлы в [`refactor/`](./refactor/) — reference-quality: они должны *читаться* как валидный Angular-код, но не запускаются как есть (Part 1 workspace ещё не поднят). Когда появится workspace — эти файлы туда переезжают без изменений.
