import * as clock from "../../../../kit/clock.js";
import { BounceBudgetEngine, defaultBounceBudgetEngine } from "./bounce-budget-engine.js";
import { BounceBudgetValidator, defaultBounceBudgetValidator } from "./bounce-budget-rules.js";
import { BounceBudgetStore } from "./bounce-budget-store.js";

/** Moves bounce budgets through their life cycle and keeps a journal of what it did. */
export class BounceBudgetService {
  store: BounceBudgetStore;
  validator: BounceBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceBudgetEngine;

  constructor(
    store: BounceBudgetStore,
    validator: BounceBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceBudgetEngine,
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
      throw new Error(`bounce budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBounceBudgetService(store: BounceBudgetStore, clockValue: clock.Clock): BounceBudgetService {
  return new BounceBudgetService(store, defaultBounceBudgetValidator(), clockValue, [], defaultBounceBudgetEngine());
}
