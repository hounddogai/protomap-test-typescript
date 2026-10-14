import * as clock from "../../../../kit/clock.js";
import { BatchedTierMilestoneEngine, defaultBatchedTierMilestoneEngine } from "./batched-tier-milestone-engine.js";
import {
  BatchedTierMilestoneValidator,
  defaultBatchedTierMilestoneValidator,
} from "./batched-tier-milestone-rules.js";
import { BatchedTierMilestoneStore } from "./batched-tier-milestone-store.js";

/** Moves batched tier milestones through their life cycle and keeps a journal of what it did. */
export class BatchedTierMilestoneCoordinator {
  store: BatchedTierMilestoneStore;
  validator: BatchedTierMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedTierMilestoneEngine;

  constructor(
    store: BatchedTierMilestoneStore,
    validator: BatchedTierMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedTierMilestoneEngine,
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
      throw new Error(`batched tier milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched tier milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched tier milestone ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedTierMilestoneCoordinator(store: BatchedTierMilestoneStore, clockValue: clock.Clock): BatchedTierMilestoneCoordinator {
  return new BatchedTierMilestoneCoordinator(
    store,
    defaultBatchedTierMilestoneValidator(),
    clockValue,
    [],
    defaultBatchedTierMilestoneEngine(),
  );
}
