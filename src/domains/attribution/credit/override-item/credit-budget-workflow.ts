import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditBudgetEngine, defaultCreditBudgetEngine } from "./credit-budget-engine.js";
import { CreditBudgetValidator, defaultCreditBudgetValidator } from "./credit-budget-rules.js";
import { CreditBudgetStore } from "./credit-budget-store.js";

/** Moves credit budgets through their life cycle and keeps a journal of what it did. */
export class CreditBudgetWorkflow {
  store: CreditBudgetStore;
  validator: CreditBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditBudgetEngine;

  constructor(
    store: CreditBudgetStore,
    validator: CreditBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditBudgetEngine,
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
      throw new Error(`credit budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit budget ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newCreditBudgetWorkflow(store: CreditBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditBudgetWorkflow {
  return new CreditBudgetWorkflow(
    store,
    defaultCreditBudgetValidator(),
    clockValue,
    [],
    defaultCreditBudgetEngine(flagsValue),
  );
}
