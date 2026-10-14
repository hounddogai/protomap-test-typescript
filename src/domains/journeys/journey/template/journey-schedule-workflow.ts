import * as clock from "../../../../kit/clock.js";
import { JourneyScheduleValidator, defaultJourneyScheduleValidator } from "./journey-schedule-rules.js";
import { JourneyScheduleStore } from "./journey-schedule-store.js";

/** Moves journey schedules through their life cycle and keeps a journal of what it did. */
export class JourneyScheduleDesk {
  store: JourneyScheduleStore;
  validator: JourneyScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: JourneyScheduleStore,
    validator: JourneyScheduleValidator,
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
      throw new Error(`journey schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey schedule ${code} not found`);
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
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newJourneyScheduleDesk(store: JourneyScheduleStore, clockValue: clock.Clock): JourneyScheduleDesk {
  return new JourneyScheduleDesk(store, defaultJourneyScheduleValidator(), clockValue, []);
}
