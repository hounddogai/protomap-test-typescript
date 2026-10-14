import * as clock from "../../../../kit/clock.js";
import {
  BatchedInviteScheduleValidator,
  defaultBatchedInviteScheduleValidator,
} from "./batched-invite-schedule-rules.js";
import { BatchedInviteScheduleStore } from "./batched-invite-schedule-store.js";

/** Moves batched invite schedules through their life cycle and keeps a journal of what it did. */
export class BatchedInviteScheduleCoordinator {
  store: BatchedInviteScheduleStore;
  validator: BatchedInviteScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedInviteScheduleStore,
    validator: BatchedInviteScheduleValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched invite schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched invite schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newBatchedInviteScheduleCoordinator(store: BatchedInviteScheduleStore, clockValue: clock.Clock): BatchedInviteScheduleCoordinator {
  return new BatchedInviteScheduleCoordinator(store, defaultBatchedInviteScheduleValidator(), clockValue, []);
}
