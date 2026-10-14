import * as clock from "../../../../kit/clock.js";
import {
  BatchedEnrollmentDraftValidator,
  defaultBatchedEnrollmentDraftValidator,
} from "./batched-enrollment-draft-rules.js";
import { BatchedEnrollmentDraftStore } from "./batched-enrollment-draft-store.js";

/** Moves batched enrollment drafts through their life cycle and keeps a journal of what it did. */
export class BatchedEnrollmentDraftManager {
  store: BatchedEnrollmentDraftStore;
  validator: BatchedEnrollmentDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedEnrollmentDraftStore,
    validator: BatchedEnrollmentDraftValidator,
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
      throw new Error(`batched enrollment draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched enrollment draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newBatchedEnrollmentDraftManager(store: BatchedEnrollmentDraftStore, clockValue: clock.Clock): BatchedEnrollmentDraftManager {
  return new BatchedEnrollmentDraftManager(store, defaultBatchedEnrollmentDraftValidator(), clockValue, []);
}
