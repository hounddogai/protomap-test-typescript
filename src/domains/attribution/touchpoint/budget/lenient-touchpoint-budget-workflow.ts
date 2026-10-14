import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientTouchpointBudgetEngine,
  defaultLenientTouchpointBudgetEngine,
} from "./lenient-touchpoint-budget-engine.js";
import {
  LenientTouchpointBudgetValidator,
  defaultLenientTouchpointBudgetValidator,
} from "./lenient-touchpoint-budget-rules.js";
import { LenientTouchpointBudgetStore } from "./lenient-touchpoint-budget-store.js";

/** Moves lenient touchpoint budgets through their life cycle and keeps a journal of what it did. */
export class LenientTouchpointBudgetManager {
  store: LenientTouchpointBudgetStore;
  validator: LenientTouchpointBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientTouchpointBudgetEngine;

  constructor(
    store: LenientTouchpointBudgetStore,
    validator: LenientTouchpointBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientTouchpointBudgetEngine,
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
      throw new Error(`lenient touchpoint budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient touchpoint budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient touchpoint budget ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLenientTouchpointBudgetManager(store: LenientTouchpointBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientTouchpointBudgetManager {
  return new LenientTouchpointBudgetManager(
    store,
    defaultLenientTouchpointBudgetValidator(),
    clockValue,
    [],
    defaultLenientTouchpointBudgetEngine(flagsValue),
  );
}
