import * as clock from "../../../../kit/clock.js";
import { BatchedProofCycleValidator, defaultBatchedProofCycleValidator } from "./batched-proof-cycle-rules.js";
import { BatchedProofCycleStore } from "./batched-proof-cycle-store.js";

/** Moves batched proof cycles through their life cycle and keeps a journal of what it did. */
export class BatchedProofCycleService {
  store: BatchedProofCycleStore;
  validator: BatchedProofCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedProofCycleStore,
    validator: BatchedProofCycleValidator,
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
      throw new Error(`batched proof cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched proof cycle ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedProofCycleService(store: BatchedProofCycleStore, clockValue: clock.Clock): BatchedProofCycleService {
  return new BatchedProofCycleService(store, defaultBatchedProofCycleValidator(), clockValue, []);
}
