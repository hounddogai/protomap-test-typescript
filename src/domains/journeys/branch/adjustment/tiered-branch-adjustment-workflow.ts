import * as clock from "../../../../kit/clock.js";
import {
  TieredBranchAdjustmentEngine,
  defaultTieredBranchAdjustmentEngine,
} from "./tiered-branch-adjustment-engine.js";
import {
  TieredBranchAdjustmentValidator,
  defaultTieredBranchAdjustmentValidator,
} from "./tiered-branch-adjustment-rules.js";
import { TieredBranchAdjustmentStore } from "./tiered-branch-adjustment-store.js";

/** Moves tiered branch adjustments through their life cycle and keeps a journal of what it did. */
export class TieredBranchAdjustmentWorkflow {
  store: TieredBranchAdjustmentStore;
  validator: TieredBranchAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredBranchAdjustmentEngine;

  constructor(
    store: TieredBranchAdjustmentStore,
    validator: TieredBranchAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredBranchAdjustmentEngine,
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
      throw new Error(`tiered branch adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered branch adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered branch adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newTieredBranchAdjustmentWorkflow(store: TieredBranchAdjustmentStore, clockValue: clock.Clock): TieredBranchAdjustmentWorkflow {
  return new TieredBranchAdjustmentWorkflow(
    store,
    defaultTieredBranchAdjustmentValidator(),
    clockValue,
    [],
    defaultTieredBranchAdjustmentEngine(),
  );
}
