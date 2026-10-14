import * as clock from "../../../../kit/clock.js";
import {
  RegionalStreakScheduleValidator,
  defaultRegionalStreakScheduleValidator,
} from "./regional-streak-schedule-rules.js";
import { RegionalStreakScheduleStore } from "./regional-streak-schedule-store.js";

/** Moves regional streak schedules through their life cycle and keeps a journal of what it did. */
export class RegionalStreakScheduleService {
  store: RegionalStreakScheduleStore;
  validator: RegionalStreakScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalStreakScheduleStore,
    validator: RegionalStreakScheduleValidator,
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
      throw new Error(`regional streak schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional streak schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRegionalStreakScheduleService(store: RegionalStreakScheduleStore, clockValue: clock.Clock): RegionalStreakScheduleService {
  return new RegionalStreakScheduleService(store, defaultRegionalStreakScheduleValidator(), clockValue, []);
}
