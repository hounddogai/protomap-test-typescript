import * as clock from "../../../../kit/clock.js";
import {
  DefaultDeflectionBudgetEngine,
  defaultDefaultDeflectionBudgetEngine,
} from "./default-deflection-budget-engine.js";
import {
  DefaultDeflectionBudgetValidator,
  defaultDefaultDeflectionBudgetValidator,
} from "./default-deflection-budget-rules.js";
import { DefaultDeflectionBudgetStore } from "./default-deflection-budget-store.js";

/** Moves default deflection budgets through their life cycle and keeps a journal of what it did. */
export class DefaultDeflectionBudgetDesk {
  store: DefaultDeflectionBudgetStore;
  validator: DefaultDeflectionBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultDeflectionBudgetEngine;

  constructor(
    store: DefaultDeflectionBudgetStore,
    validator: DefaultDeflectionBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultDeflectionBudgetEngine,
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
      throw new Error(`default deflection budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default deflection budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default deflection budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDefaultDeflectionBudgetDesk(store: DefaultDeflectionBudgetStore, clockValue: clock.Clock): DefaultDeflectionBudgetDesk {
  return new DefaultDeflectionBudgetDesk(
    store,
    defaultDefaultDeflectionBudgetValidator(),
    clockValue,
    [],
    defaultDefaultDeflectionBudgetEngine(),
  );
}
