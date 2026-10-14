import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedWaitAdjustmentEngine, defaultCappedWaitAdjustmentEngine } from "./capped-wait-adjustment-engine.js";
import {
  CappedWaitAdjustmentValidator,
  defaultCappedWaitAdjustmentValidator,
} from "./capped-wait-adjustment-rules.js";
import { CappedWaitAdjustmentStore } from "./capped-wait-adjustment-store.js";

/** Moves capped wait adjustments through their life cycle and keeps a journal of what it did. */
export class CappedWaitAdjustmentCoordinator {
  store: CappedWaitAdjustmentStore;
  validator: CappedWaitAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedWaitAdjustmentEngine;

  constructor(
    store: CappedWaitAdjustmentStore,
    validator: CappedWaitAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedWaitAdjustmentEngine,
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
      throw new Error(`capped wait adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped wait adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped wait adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedWaitAdjustmentCoordinator(store: CappedWaitAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedWaitAdjustmentCoordinator {
  return new CappedWaitAdjustmentCoordinator(
    store,
    defaultCappedWaitAdjustmentValidator(),
    clockValue,
    [],
    defaultCappedWaitAdjustmentEngine(flagsValue),
  );
}
