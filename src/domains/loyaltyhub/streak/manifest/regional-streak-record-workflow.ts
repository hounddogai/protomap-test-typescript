import * as clock from "../../../../kit/clock.js";
import {
  RegionalStreakRecordValidator,
  defaultRegionalStreakRecordValidator,
} from "./regional-streak-record-rules.js";
import { RegionalStreakRecordStore } from "./regional-streak-record-store.js";

/** Moves regional streak records through their life cycle and keeps a journal of what it did. */
export class RegionalStreakRecordCoordinator {
  store: RegionalStreakRecordStore;
  validator: RegionalStreakRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalStreakRecordStore,
    validator: RegionalStreakRecordValidator,
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
      throw new Error(`regional streak record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional streak record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newRegionalStreakRecordCoordinator(store: RegionalStreakRecordStore, clockValue: clock.Clock): RegionalStreakRecordCoordinator {
  return new RegionalStreakRecordCoordinator(store, defaultRegionalStreakRecordValidator(), clockValue, []);
}
