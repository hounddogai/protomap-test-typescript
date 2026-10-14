import * as clock from "../../../../kit/clock.js";
import { StreakScheduleEngine, defaultStreakScheduleEngine } from "./streak-schedule-engine.js";
import { StreakScheduleValidator, defaultStreakScheduleValidator } from "./streak-schedule-rules.js";
import { StreakScheduleStore } from "./streak-schedule-store.js";

/** Moves streak schedules through their life cycle and keeps a journal of what it did. */
export class StreakScheduleDesk {
  store: StreakScheduleStore;
  validator: StreakScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakScheduleEngine;

  constructor(
    store: StreakScheduleStore,
    validator: StreakScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakScheduleEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak schedule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newStreakScheduleDesk(store: StreakScheduleStore, clockValue: clock.Clock): StreakScheduleDesk {
  return new StreakScheduleDesk(store, defaultStreakScheduleValidator(), clockValue, [], defaultStreakScheduleEngine());
}
