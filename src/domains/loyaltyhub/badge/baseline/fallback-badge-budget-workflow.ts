import * as clock from "../../../../kit/clock.js";
import { FallbackBadgeBudgetEngine, defaultFallbackBadgeBudgetEngine } from "./fallback-badge-budget-engine.js";
import { FallbackBadgeBudgetValidator, defaultFallbackBadgeBudgetValidator } from "./fallback-badge-budget-rules.js";
import { FallbackBadgeBudgetStore } from "./fallback-badge-budget-store.js";

/** Moves fallback badge budgets through their life cycle and keeps a journal of what it did. */
export class FallbackBadgeBudgetWorkflow {
  store: FallbackBadgeBudgetStore;
  validator: FallbackBadgeBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackBadgeBudgetEngine;

  constructor(
    store: FallbackBadgeBudgetStore,
    validator: FallbackBadgeBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackBadgeBudgetEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback badge budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback badge budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback badge budget ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackBadgeBudgetWorkflow(store: FallbackBadgeBudgetStore, clockValue: clock.Clock): FallbackBadgeBudgetWorkflow {
  return new FallbackBadgeBudgetWorkflow(
    store,
    defaultFallbackBadgeBudgetValidator(),
    clockValue,
    [],
    defaultFallbackBadgeBudgetEngine(),
  );
}
