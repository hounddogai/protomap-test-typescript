import * as clock from "../../../../kit/clock.js";
import {
  SeasonalWaitScheduleValidator,
  defaultSeasonalWaitScheduleValidator,
} from "./seasonal-wait-schedule-rules.js";
import { SeasonalWaitScheduleStore } from "./seasonal-wait-schedule-store.js";

/** Moves seasonal wait schedules through their life cycle and keeps a journal of what it did. */
export class SeasonalWaitScheduleDesk {
  store: SeasonalWaitScheduleStore;
  validator: SeasonalWaitScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalWaitScheduleStore,
    validator: SeasonalWaitScheduleValidator,
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
      throw new Error(`seasonal wait schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal wait schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newSeasonalWaitScheduleDesk(store: SeasonalWaitScheduleStore, clockValue: clock.Clock): SeasonalWaitScheduleDesk {
  return new SeasonalWaitScheduleDesk(store, defaultSeasonalWaitScheduleValidator(), clockValue, []);
}
