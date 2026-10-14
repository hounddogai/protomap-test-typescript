import * as clock from "../../../../kit/clock.js";
import { BatchedPayoutBatchValidator, defaultBatchedPayoutBatchValidator } from "./batched-payout-batch-rules.js";
import { BatchedPayoutBatchStore } from "./batched-payout-batch-store.js";

/** Moves batched payout batches through their life cycle and keeps a journal of what it did. */
export class BatchedPayoutBatchManager {
  store: BatchedPayoutBatchStore;
  validator: BatchedPayoutBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedPayoutBatchStore,
    validator: BatchedPayoutBatchValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched payout batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched payout batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newBatchedPayoutBatchManager(store: BatchedPayoutBatchStore, clockValue: clock.Clock): BatchedPayoutBatchManager {
  return new BatchedPayoutBatchManager(store, defaultBatchedPayoutBatchValidator(), clockValue, []);
}
