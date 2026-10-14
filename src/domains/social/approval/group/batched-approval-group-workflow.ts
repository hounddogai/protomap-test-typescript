import * as clock from "../../../../kit/clock.js";
import {
  BatchedApprovalGroupValidator,
  defaultBatchedApprovalGroupValidator,
} from "./batched-approval-group-rules.js";
import { BatchedApprovalGroupStore } from "./batched-approval-group-store.js";

/** Moves batched approval groups through their life cycle and keeps a journal of what it did. */
export class BatchedApprovalGroupDesk {
  store: BatchedApprovalGroupStore;
  validator: BatchedApprovalGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedApprovalGroupStore,
    validator: BatchedApprovalGroupValidator,
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
      throw new Error(`batched approval group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched approval group ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedApprovalGroupDesk(store: BatchedApprovalGroupStore, clockValue: clock.Clock): BatchedApprovalGroupDesk {
  return new BatchedApprovalGroupDesk(store, defaultBatchedApprovalGroupValidator(), clockValue, []);
}
