import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackStreakTargetEngine, defaultFallbackStreakTargetEngine } from "./fallback-streak-target-engine.js";
import {
  FallbackStreakTargetValidator,
  defaultFallbackStreakTargetValidator,
} from "./fallback-streak-target-rules.js";
import { FallbackStreakTargetStore } from "./fallback-streak-target-store.js";

/** Moves fallback streak targets through their life cycle and keeps a journal of what it did. */
export class FallbackStreakTargetManager {
  store: FallbackStreakTargetStore;
  validator: FallbackStreakTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackStreakTargetEngine;

  constructor(
    store: FallbackStreakTargetStore,
    validator: FallbackStreakTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackStreakTargetEngine,
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
      throw new Error(`fallback streak target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback streak target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback streak target ${code} not found`);
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

export function newFallbackStreakTargetManager(store: FallbackStreakTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackStreakTargetManager {
  return new FallbackStreakTargetManager(
    store,
    defaultFallbackStreakTargetValidator(),
    clockValue,
    [],
    defaultFallbackStreakTargetEngine(flagsValue),
  );
}
