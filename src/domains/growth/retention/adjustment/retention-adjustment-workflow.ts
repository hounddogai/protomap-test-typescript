import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionAdjustmentEngine, defaultRetentionAdjustmentEngine } from "./retention-adjustment-engine.js";
import { RetentionAdjustmentValidator, defaultRetentionAdjustmentValidator } from "./retention-adjustment-rules.js";
import { RetentionAdjustmentStore } from "./retention-adjustment-store.js";

/** Moves retention adjustments through their life cycle and keeps a journal of what it did. */
export class RetentionAdjustmentDesk {
  store: RetentionAdjustmentStore;
  validator: RetentionAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionAdjustmentEngine;

  constructor(
    store: RetentionAdjustmentStore,
    validator: RetentionAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionAdjustmentEngine,
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
      throw new Error(`retention adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionAdjustmentDesk(store: RetentionAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionAdjustmentDesk {
  return new RetentionAdjustmentDesk(
    store,
    defaultRetentionAdjustmentValidator(),
    clockValue,
    [],
    defaultRetentionAdjustmentEngine(flagsValue),
  );
}
