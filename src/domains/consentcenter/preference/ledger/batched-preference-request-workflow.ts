import * as clock from "../../../../kit/clock.js";
import {
  BatchedPreferenceRequestValidator,
  defaultBatchedPreferenceRequestValidator,
} from "./batched-preference-request-rules.js";
import { BatchedPreferenceRequestStore } from "./batched-preference-request-store.js";

/** Moves batched preference requests through their life cycle and keeps a journal of what it did. */
export class BatchedPreferenceRequestService {
  store: BatchedPreferenceRequestStore;
  validator: BatchedPreferenceRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedPreferenceRequestStore,
    validator: BatchedPreferenceRequestValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched preference request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched preference request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newBatchedPreferenceRequestService(store: BatchedPreferenceRequestStore, clockValue: clock.Clock): BatchedPreferenceRequestService {
  return new BatchedPreferenceRequestService(store, defaultBatchedPreferenceRequestValidator(), clockValue, []);
}
