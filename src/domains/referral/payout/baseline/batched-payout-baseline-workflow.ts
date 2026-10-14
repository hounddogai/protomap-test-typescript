import * as clock from "../../../../kit/clock.js";
import {
  BatchedPayoutBaselineValidator,
  defaultBatchedPayoutBaselineValidator,
} from "./batched-payout-baseline-rules.js";
import { BatchedPayoutBaselineStore } from "./batched-payout-baseline-store.js";

/** Moves batched payout baselines through their life cycle and keeps a journal of what it did. */
export class BatchedPayoutBaselineDesk {
  store: BatchedPayoutBaselineStore;
  validator: BatchedPayoutBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedPayoutBaselineStore,
    validator: BatchedPayoutBaselineValidator,
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
      throw new Error(`batched payout baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched payout baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newBatchedPayoutBaselineDesk(store: BatchedPayoutBaselineStore, clockValue: clock.Clock): BatchedPayoutBaselineDesk {
  return new BatchedPayoutBaselineDesk(store, defaultBatchedPayoutBaselineValidator(), clockValue, []);
}
