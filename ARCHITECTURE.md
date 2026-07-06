# Architecture Notes (Part 2)

> Status: **skeleton**. Content to be filled in after Part 3.

## 1. Why split into `data-access` / `util` / `feature` / `ui`?

_TODO: short rationale + one concrete bug that the "ui imports no services" rule prevents._

## 2. Global store vs SignalStore vs local signal — rule of thumb

_TODO: where each lives in this feature, where teams usually get it wrong._

## 3. What changes in this code with Zone.js gone? What breaks during a zoneless migration of a legacy app?

_TODO: concrete pain points + how to find them._

## 4. A new `payments` domain needs supplier identity and invoice data — how to share without cycles or a god-library?

_TODO: shared kernel / published API / contract approach._
