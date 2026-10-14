import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StreakBaselineEngine, defaultStreakBaselineEngine } from "./streak-baseline-engine.js";
import { StreakBaselineValidator, defaultStreakBaselineValidator } from "./streak-baseline-rules.js";
import { StreakBaselineStore } from "./streak-baseline-store.js";

/** Moves streak baselines through their life cycle and keeps a journal of what it did. */
export class StreakBaselineManager {
  store: StreakBaselineStore;
  validator: StreakBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakBaselineEngine;

  constructor(
    store: StreakBaselineStore,
    validator: StreakBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakBaselineEngine,
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
      throw new Error(`streak baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak baseline ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newStreakBaselineManager(store: StreakBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): StreakBaselineManager {
  return new StreakBaselineManager(
    store,
    defaultStreakBaselineValidator(),
    clockValue,
    [],
    defaultStreakBaselineEngine(flagsValue),
  );
}
