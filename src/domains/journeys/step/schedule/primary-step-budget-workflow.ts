import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryStepBudgetEngine, defaultPrimaryStepBudgetEngine } from "./primary-step-budget-engine.js";
import { PrimaryStepBudgetValidator, defaultPrimaryStepBudgetValidator } from "./primary-step-budget-rules.js";
import { PrimaryStepBudgetStore } from "./primary-step-budget-store.js";

/** Moves primary step budgets through their life cycle and keeps a journal of what it did. */
export class PrimaryStepBudgetWorkflow {
  store: PrimaryStepBudgetStore;
  validator: PrimaryStepBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryStepBudgetEngine;

  constructor(
    store: PrimaryStepBudgetStore,
    validator: PrimaryStepBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryStepBudgetEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary step budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary step budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary step budget ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPrimaryStepBudgetWorkflow(store: PrimaryStepBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryStepBudgetWorkflow {
  return new PrimaryStepBudgetWorkflow(
    store,
    defaultPrimaryStepBudgetValidator(),
    clockValue,
    [],
    defaultPrimaryStepBudgetEngine(flagsValue),
  );
}
