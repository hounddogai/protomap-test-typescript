import * as clock from "../../../../kit/clock.js";
import {
  ScheduledStreakSummaryValidator,
  defaultScheduledStreakSummaryValidator,
} from "./scheduled-streak-summary-rules.js";
import { ScheduledStreakSummaryStore } from "./scheduled-streak-summary-store.js";

/** Moves scheduled streak summaries through their life cycle and keeps a journal of what it did. */
export class ScheduledStreakSummaryCoordinator {
  store: ScheduledStreakSummaryStore;
  validator: ScheduledStreakSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledStreakSummaryStore,
    validator: ScheduledStreakSummaryValidator,
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
      throw new Error(`scheduled streak summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled streak summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newScheduledStreakSummaryCoordinator(store: ScheduledStreakSummaryStore, clockValue: clock.Clock): ScheduledStreakSummaryCoordinator {
  return new ScheduledStreakSummaryCoordinator(store, defaultScheduledStreakSummaryValidator(), clockValue, []);
}
