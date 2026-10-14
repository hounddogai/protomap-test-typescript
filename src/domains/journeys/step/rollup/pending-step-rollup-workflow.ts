import * as clock from "../../../../kit/clock.js";
import { PendingStepRollupEngine, defaultPendingStepRollupEngine } from "./pending-step-rollup-engine.js";
import { PendingStepRollupValidator, defaultPendingStepRollupValidator } from "./pending-step-rollup-rules.js";
import { PendingStepRollupStore } from "./pending-step-rollup-store.js";

/** Moves pending step rollups through their life cycle and keeps a journal of what it did. */
export class PendingStepRollupManager {
  store: PendingStepRollupStore;
  validator: PendingStepRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingStepRollupEngine;

  constructor(
    store: PendingStepRollupStore,
    validator: PendingStepRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingStepRollupEngine,
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
      throw new Error(`pending step rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending step rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending step rollup ${code} not found`);
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

export function newPendingStepRollupManager(store: PendingStepRollupStore, clockValue: clock.Clock): PendingStepRollupManager {
  return new PendingStepRollupManager(
    store,
    defaultPendingStepRollupValidator(),
    clockValue,
    [],
    defaultPendingStepRollupEngine(),
  );
}
