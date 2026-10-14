import * as clock from "../../../../kit/clock.js";
import {
  BatchedPathPreferenceValidator,
  defaultBatchedPathPreferenceValidator,
} from "./batched-path-preference-rules.js";
import { BatchedPathPreferenceStore } from "./batched-path-preference-store.js";

/** Moves batched path preferences through their life cycle and keeps a journal of what it did. */
export class BatchedPathPreferenceDesk {
  store: BatchedPathPreferenceStore;
  validator: BatchedPathPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedPathPreferenceStore,
    validator: BatchedPathPreferenceValidator,
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
      throw new Error(`batched path preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched path preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newBatchedPathPreferenceDesk(store: BatchedPathPreferenceStore, clockValue: clock.Clock): BatchedPathPreferenceDesk {
  return new BatchedPathPreferenceDesk(store, defaultBatchedPathPreferenceValidator(), clockValue, []);
}
