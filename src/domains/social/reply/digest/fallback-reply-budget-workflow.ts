import * as clock from "../../../../kit/clock.js";
import { FallbackReplyBudgetEngine, defaultFallbackReplyBudgetEngine } from "./fallback-reply-budget-engine.js";
import { FallbackReplyBudgetValidator, defaultFallbackReplyBudgetValidator } from "./fallback-reply-budget-rules.js";
import { FallbackReplyBudgetStore } from "./fallback-reply-budget-store.js";

/** Moves fallback reply budgets through their life cycle and keeps a journal of what it did. */
export class FallbackReplyBudgetService {
  store: FallbackReplyBudgetStore;
  validator: FallbackReplyBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackReplyBudgetEngine;

  constructor(
    store: FallbackReplyBudgetStore,
    validator: FallbackReplyBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackReplyBudgetEngine,
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
      throw new Error(`fallback reply budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reply budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reply budget ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackReplyBudgetService(store: FallbackReplyBudgetStore, clockValue: clock.Clock): FallbackReplyBudgetService {
  return new FallbackReplyBudgetService(
    store,
    defaultFallbackReplyBudgetValidator(),
    clockValue,
    [],
    defaultFallbackReplyBudgetEngine(),
  );
}
