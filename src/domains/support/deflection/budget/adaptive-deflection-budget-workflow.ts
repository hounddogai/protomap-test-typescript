import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveDeflectionBudgetEngine,
  defaultAdaptiveDeflectionBudgetEngine,
} from "./adaptive-deflection-budget-engine.js";
import {
  AdaptiveDeflectionBudgetValidator,
  defaultAdaptiveDeflectionBudgetValidator,
} from "./adaptive-deflection-budget-rules.js";
import { AdaptiveDeflectionBudgetStore } from "./adaptive-deflection-budget-store.js";

/** Moves adaptive deflection budgets through their life cycle and keeps a journal of what it did. */
export class AdaptiveDeflectionBudgetDesk {
  store: AdaptiveDeflectionBudgetStore;
  validator: AdaptiveDeflectionBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDeflectionBudgetEngine;

  constructor(
    store: AdaptiveDeflectionBudgetStore,
    validator: AdaptiveDeflectionBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDeflectionBudgetEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive deflection budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive deflection budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive deflection budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveDeflectionBudgetDesk(store: AdaptiveDeflectionBudgetStore, clockValue: clock.Clock): AdaptiveDeflectionBudgetDesk {
  return new AdaptiveDeflectionBudgetDesk(
    store,
    defaultAdaptiveDeflectionBudgetValidator(),
    clockValue,
    [],
    defaultAdaptiveDeflectionBudgetEngine(),
  );
}
