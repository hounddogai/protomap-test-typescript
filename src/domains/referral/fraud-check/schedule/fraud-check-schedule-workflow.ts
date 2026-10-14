import * as clock from "../../../../kit/clock.js";
import { FraudCheckScheduleValidator, defaultFraudCheckScheduleValidator } from "./fraud-check-schedule-rules.js";
import { FraudCheckScheduleStore } from "./fraud-check-schedule-store.js";

/** Moves fraud check schedules through their life cycle and keeps a journal of what it did. */
export class FraudCheckScheduleDesk {
  store: FraudCheckScheduleStore;
  validator: FraudCheckScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FraudCheckScheduleStore,
    validator: FraudCheckScheduleValidator,
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
      throw new Error(`fraud check schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFraudCheckScheduleDesk(store: FraudCheckScheduleStore, clockValue: clock.Clock): FraudCheckScheduleDesk {
  return new FraudCheckScheduleDesk(store, defaultFraudCheckScheduleValidator(), clockValue, []);
}
