import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyPacingBudgetEngine, defaultLegacyPacingBudgetEngine } from "./legacy-pacing-budget-engine.js";
import { LegacyPacingBudgetValidator, defaultLegacyPacingBudgetValidator } from "./legacy-pacing-budget-rules.js";
import { LegacyPacingBudgetStore } from "./legacy-pacing-budget-store.js";

/** Moves legacy pacing budgets through their life cycle and keeps a journal of what it did. */
export class LegacyPacingBudgetWorkflow {
  store: LegacyPacingBudgetStore;
  validator: LegacyPacingBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPacingBudgetEngine;

  constructor(
    store: LegacyPacingBudgetStore,
    validator: LegacyPacingBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPacingBudgetEngine,
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
      throw new Error(`legacy pacing budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy pacing budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy pacing budget ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLegacyPacingBudgetWorkflow(store: LegacyPacingBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyPacingBudgetWorkflow {
  return new LegacyPacingBudgetWorkflow(
    store,
    defaultLegacyPacingBudgetValidator(),
    clockValue,
    [],
    defaultLegacyPacingBudgetEngine(flagsValue),
  );
}
