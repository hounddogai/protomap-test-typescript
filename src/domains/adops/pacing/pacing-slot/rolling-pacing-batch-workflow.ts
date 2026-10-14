import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingPacingBatchEngine, defaultRollingPacingBatchEngine } from "./rolling-pacing-batch-engine.js";
import { RollingPacingBatchValidator, defaultRollingPacingBatchValidator } from "./rolling-pacing-batch-rules.js";
import { RollingPacingBatchStore } from "./rolling-pacing-batch-store.js";

/** Moves rolling pacing batches through their life cycle and keeps a journal of what it did. */
export class RollingPacingBatchDesk {
  store: RollingPacingBatchStore;
  validator: RollingPacingBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPacingBatchEngine;

  constructor(
    store: RollingPacingBatchStore,
    validator: RollingPacingBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPacingBatchEngine,
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
      throw new Error(`rolling pacing batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling pacing batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling pacing batch ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRollingPacingBatchDesk(store: RollingPacingBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingPacingBatchDesk {
  return new RollingPacingBatchDesk(
    store,
    defaultRollingPacingBatchValidator(),
    clockValue,
    [],
    defaultRollingPacingBatchEngine(flagsValue),
  );
}
