import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StreakAdjustmentEngine, defaultStreakAdjustmentEngine } from "./streak-adjustment-engine.js";
import { StreakAdjustmentValidator, defaultStreakAdjustmentValidator } from "./streak-adjustment-rules.js";
import { StreakAdjustmentStore } from "./streak-adjustment-store.js";

/** Moves streak adjustments through their life cycle and keeps a journal of what it did. */
export class StreakAdjustmentWorkflow {
  store: StreakAdjustmentStore;
  validator: StreakAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakAdjustmentEngine;

  constructor(
    store: StreakAdjustmentStore,
    validator: StreakAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakAdjustmentEngine,
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
      throw new Error(`streak adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak adjustment ${code} not found`);
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

export function newStreakAdjustmentWorkflow(store: StreakAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): StreakAdjustmentWorkflow {
  return new StreakAdjustmentWorkflow(
    store,
    defaultStreakAdjustmentValidator(),
    clockValue,
    [],
    defaultStreakAdjustmentEngine(flagsValue),
  );
}
