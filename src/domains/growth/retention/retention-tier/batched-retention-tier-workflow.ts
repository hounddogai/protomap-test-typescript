import * as clock from "../../../../kit/clock.js";
import {
  BatchedRetentionTierValidator,
  defaultBatchedRetentionTierValidator,
} from "./batched-retention-tier-rules.js";
import { BatchedRetentionTierStore } from "./batched-retention-tier-store.js";

/** Moves batched retention tiers through their life cycle and keeps a journal of what it did. */
export class BatchedRetentionTierService {
  store: BatchedRetentionTierStore;
  validator: BatchedRetentionTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedRetentionTierStore,
    validator: BatchedRetentionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched retention tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched retention tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newBatchedRetentionTierService(store: BatchedRetentionTierStore, clockValue: clock.Clock): BatchedRetentionTierService {
  return new BatchedRetentionTierService(store, defaultBatchedRetentionTierValidator(), clockValue, []);
}
