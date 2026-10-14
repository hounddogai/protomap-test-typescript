import * as clock from "../../../../kit/clock.js";
import { BranchScheduleValidator, defaultBranchScheduleValidator } from "./branch-schedule-rules.js";
import { BranchScheduleStore } from "./branch-schedule-store.js";

/** Moves branch schedules through their life cycle and keeps a journal of what it did. */
export class BranchScheduleDesk {
  store: BranchScheduleStore;
  validator: BranchScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BranchScheduleStore,
    validator: BranchScheduleValidator,
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
      throw new Error(`branch schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBranchScheduleDesk(store: BranchScheduleStore, clockValue: clock.Clock): BranchScheduleDesk {
  return new BranchScheduleDesk(store, defaultBranchScheduleValidator(), clockValue, []);
}
