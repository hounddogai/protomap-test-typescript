import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedBranchManifestEngine, defaultBatchedBranchManifestEngine } from "./batched-branch-manifest-engine.js";
import {
  BatchedBranchManifestValidator,
  defaultBatchedBranchManifestValidator,
} from "./batched-branch-manifest-rules.js";
import { BatchedBranchManifestStore } from "./batched-branch-manifest-store.js";

/** Moves batched branch manifests through their life cycle and keeps a journal of what it did. */
export class BatchedBranchManifestDesk {
  store: BatchedBranchManifestStore;
  validator: BatchedBranchManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedBranchManifestEngine;

  constructor(
    store: BatchedBranchManifestStore,
    validator: BatchedBranchManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedBranchManifestEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched branch manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched branch manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched branch manifest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newBatchedBranchManifestDesk(store: BatchedBranchManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedBranchManifestDesk {
  return new BatchedBranchManifestDesk(
    store,
    defaultBatchedBranchManifestValidator(),
    clockValue,
    [],
    defaultBatchedBranchManifestEngine(flagsValue),
  );
}
