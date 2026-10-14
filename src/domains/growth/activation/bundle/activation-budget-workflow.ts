import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ActivationBudgetEngine, defaultActivationBudgetEngine } from "./activation-budget-engine.js";
import { ActivationBudgetValidator, defaultActivationBudgetValidator } from "./activation-budget-rules.js";
import { ActivationBudgetStore } from "./activation-budget-store.js";

/** Moves activation budgets through their life cycle and keeps a journal of what it did. */
export class ActivationBudgetWorkflow {
  store: ActivationBudgetStore;
  validator: ActivationBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationBudgetEngine;

  constructor(
    store: ActivationBudgetStore,
    validator: ActivationBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationBudgetEngine,
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
      throw new Error(`activation budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation budget ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newActivationBudgetWorkflow(store: ActivationBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): ActivationBudgetWorkflow {
  return new ActivationBudgetWorkflow(
    store,
    defaultActivationBudgetValidator(),
    clockValue,
    [],
    defaultActivationBudgetEngine(flagsValue),
  );
}
