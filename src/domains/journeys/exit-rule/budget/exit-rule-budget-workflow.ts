import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleBudgetEngine, defaultExitRuleBudgetEngine } from "./exit-rule-budget-engine.js";
import { ExitRuleBudgetValidator, defaultExitRuleBudgetValidator } from "./exit-rule-budget-rules.js";
import { ExitRuleBudgetStore } from "./exit-rule-budget-store.js";

/** Moves exit rule budgets through their life cycle and keeps a journal of what it did. */
export class ExitRuleBudgetCoordinator {
  store: ExitRuleBudgetStore;
  validator: ExitRuleBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleBudgetEngine;

  constructor(
    store: ExitRuleBudgetStore,
    validator: ExitRuleBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleBudgetEngine,
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
      throw new Error(`exit rule budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule budget ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newExitRuleBudgetCoordinator(store: ExitRuleBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleBudgetCoordinator {
  return new ExitRuleBudgetCoordinator(
    store,
    defaultExitRuleBudgetValidator(),
    clockValue,
    [],
    defaultExitRuleBudgetEngine(flagsValue),
  );
}
