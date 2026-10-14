import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingRetentionAdjustmentEngine,
  defaultPendingRetentionAdjustmentEngine,
} from "./pending-retention-adjustment-engine.js";
import {
  PendingRetentionAdjustmentValidator,
  defaultPendingRetentionAdjustmentValidator,
} from "./pending-retention-adjustment-rules.js";
import { PendingRetentionAdjustmentStore } from "./pending-retention-adjustment-store.js";

/** Moves pending retention adjustments through their life cycle and keeps a journal of what it did. */
export class PendingRetentionAdjustmentWorkflow {
  store: PendingRetentionAdjustmentStore;
  validator: PendingRetentionAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingRetentionAdjustmentEngine;

  constructor(
    store: PendingRetentionAdjustmentStore,
    validator: PendingRetentionAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingRetentionAdjustmentEngine,
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
      throw new Error(`pending retention adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending retention adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending retention adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingRetentionAdjustmentWorkflow(store: PendingRetentionAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingRetentionAdjustmentWorkflow {
  return new PendingRetentionAdjustmentWorkflow(
    store,
    defaultPendingRetentionAdjustmentValidator(),
    clockValue,
    [],
    defaultPendingRetentionAdjustmentEngine(flagsValue),
  );
}
