import * as clock from "../../../../kit/clock.js";
import { StrictProofAdjustmentEngine, defaultStrictProofAdjustmentEngine } from "./strict-proof-adjustment-engine.js";
import {
  StrictProofAdjustmentValidator,
  defaultStrictProofAdjustmentValidator,
} from "./strict-proof-adjustment-rules.js";
import { StrictProofAdjustmentStore } from "./strict-proof-adjustment-store.js";

/** Moves strict proof adjustments through their life cycle and keeps a journal of what it did. */
export class StrictProofAdjustmentService {
  store: StrictProofAdjustmentStore;
  validator: StrictProofAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictProofAdjustmentEngine;

  constructor(
    store: StrictProofAdjustmentStore,
    validator: StrictProofAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictProofAdjustmentEngine,
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
      throw new Error(`strict proof adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict proof adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict proof adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newStrictProofAdjustmentService(store: StrictProofAdjustmentStore, clockValue: clock.Clock): StrictProofAdjustmentService {
  return new StrictProofAdjustmentService(
    store,
    defaultStrictProofAdjustmentValidator(),
    clockValue,
    [],
    defaultStrictProofAdjustmentEngine(),
  );
}
