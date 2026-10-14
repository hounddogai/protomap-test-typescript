import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackCreditBudgetEngine, defaultFallbackCreditBudgetEngine } from "./fallback-credit-budget-engine.js";
import {
  FallbackCreditBudgetValidator,
  defaultFallbackCreditBudgetValidator,
} from "./fallback-credit-budget-rules.js";
import { FallbackCreditBudgetStore } from "./fallback-credit-budget-store.js";

/** Moves fallback credit budgets through their life cycle and keeps a journal of what it did. */
export class FallbackCreditBudgetManager {
  store: FallbackCreditBudgetStore;
  validator: FallbackCreditBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackCreditBudgetEngine;

  constructor(
    store: FallbackCreditBudgetStore,
    validator: FallbackCreditBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackCreditBudgetEngine,
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
      throw new Error(`fallback credit budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback credit budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback credit budget ${code} not found`);
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

export function newFallbackCreditBudgetManager(store: FallbackCreditBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackCreditBudgetManager {
  return new FallbackCreditBudgetManager(
    store,
    defaultFallbackCreditBudgetValidator(),
    clockValue,
    [],
    defaultFallbackCreditBudgetEngine(flagsValue),
  );
}
