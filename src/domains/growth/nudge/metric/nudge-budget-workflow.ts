import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { NudgeBudgetEngine, defaultNudgeBudgetEngine } from "./nudge-budget-engine.js";
import { NudgeBudgetValidator, defaultNudgeBudgetValidator } from "./nudge-budget-rules.js";
import { NudgeBudgetStore } from "./nudge-budget-store.js";

/** Moves nudge budgets through their life cycle and keeps a journal of what it did. */
export class NudgeBudgetService {
  store: NudgeBudgetStore;
  validator: NudgeBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeBudgetEngine;

  constructor(
    store: NudgeBudgetStore,
    validator: NudgeBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeBudgetEngine,
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
      throw new Error(`nudge budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge budget ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newNudgeBudgetService(store: NudgeBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): NudgeBudgetService {
  return new NudgeBudgetService(
    store,
    defaultNudgeBudgetValidator(),
    clockValue,
    [],
    defaultNudgeBudgetEngine(flagsValue),
  );
}
