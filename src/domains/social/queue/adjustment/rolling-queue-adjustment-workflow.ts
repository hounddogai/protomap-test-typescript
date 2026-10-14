import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingQueueAdjustmentEngine,
  defaultRollingQueueAdjustmentEngine,
} from "./rolling-queue-adjustment-engine.js";
import {
  RollingQueueAdjustmentValidator,
  defaultRollingQueueAdjustmentValidator,
} from "./rolling-queue-adjustment-rules.js";
import { RollingQueueAdjustmentStore } from "./rolling-queue-adjustment-store.js";

/** Moves rolling queue adjustments through their life cycle and keeps a journal of what it did. */
export class RollingQueueAdjustmentDesk {
  store: RollingQueueAdjustmentStore;
  validator: RollingQueueAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingQueueAdjustmentEngine;

  constructor(
    store: RollingQueueAdjustmentStore,
    validator: RollingQueueAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingQueueAdjustmentEngine,
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
      throw new Error(`rolling queue adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling queue adjustment ${code} not found`);
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
      throw new Error(`rolling queue adjustment ${code} not found`);
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

export function newRollingQueueAdjustmentDesk(store: RollingQueueAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingQueueAdjustmentDesk {
  return new RollingQueueAdjustmentDesk(
    store,
    defaultRollingQueueAdjustmentValidator(),
    clockValue,
    [],
    defaultRollingQueueAdjustmentEngine(flagsValue),
  );
}
