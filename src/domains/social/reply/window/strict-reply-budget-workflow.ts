import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictReplyBudgetEngine, defaultStrictReplyBudgetEngine } from "./strict-reply-budget-engine.js";
import { StrictReplyBudgetValidator, defaultStrictReplyBudgetValidator } from "./strict-reply-budget-rules.js";
import { StrictReplyBudgetStore } from "./strict-reply-budget-store.js";

/** Moves strict reply budgets through their life cycle and keeps a journal of what it did. */
export class StrictReplyBudgetService {
  store: StrictReplyBudgetStore;
  validator: StrictReplyBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictReplyBudgetEngine;

  constructor(
    store: StrictReplyBudgetStore,
    validator: StrictReplyBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictReplyBudgetEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reply budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reply budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reply budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictReplyBudgetService(store: StrictReplyBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictReplyBudgetService {
  return new StrictReplyBudgetService(
    store,
    defaultStrictReplyBudgetValidator(),
    clockValue,
    [],
    defaultStrictReplyBudgetEngine(flagsValue),
  );
}
