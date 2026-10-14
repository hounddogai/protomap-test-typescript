import * as clock from "../../../../kit/clock.js";
import {
  ScheduledCohortBatchValidator,
  defaultScheduledCohortBatchValidator,
} from "./scheduled-cohort-batch-rules.js";
import { ScheduledCohortBatchStore } from "./scheduled-cohort-batch-store.js";

/** Moves scheduled cohort batches through their life cycle and keeps a journal of what it did. */
export class ScheduledCohortBatchCoordinator {
  store: ScheduledCohortBatchStore;
  validator: ScheduledCohortBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledCohortBatchStore,
    validator: ScheduledCohortBatchValidator,
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
      throw new Error(`scheduled cohort batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled cohort batch ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledCohortBatchCoordinator(store: ScheduledCohortBatchStore, clockValue: clock.Clock): ScheduledCohortBatchCoordinator {
  return new ScheduledCohortBatchCoordinator(store, defaultScheduledCohortBatchValidator(), clockValue, []);
}
