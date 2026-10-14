import * as clock from "../../../../kit/clock.js";
import { PendingBranchBaselineEngine, defaultPendingBranchBaselineEngine } from "./pending-branch-baseline-engine.js";
import {
  PendingBranchBaselineValidator,
  defaultPendingBranchBaselineValidator,
} from "./pending-branch-baseline-rules.js";
import { PendingBranchBaselineStore } from "./pending-branch-baseline-store.js";

/** Moves pending branch baselines through their life cycle and keeps a journal of what it did. */
export class PendingBranchBaselineCoordinator {
  store: PendingBranchBaselineStore;
  validator: PendingBranchBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBranchBaselineEngine;

  constructor(
    store: PendingBranchBaselineStore,
    validator: PendingBranchBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBranchBaselineEngine,
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
      throw new Error(`pending branch baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending branch baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending branch baseline ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPendingBranchBaselineCoordinator(store: PendingBranchBaselineStore, clockValue: clock.Clock): PendingBranchBaselineCoordinator {
  return new PendingBranchBaselineCoordinator(
    store,
    defaultPendingBranchBaselineValidator(),
    clockValue,
    [],
    defaultPendingBranchBaselineEngine(),
  );
}
