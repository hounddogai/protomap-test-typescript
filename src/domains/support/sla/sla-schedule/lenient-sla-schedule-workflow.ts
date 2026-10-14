import * as clock from "../../../../kit/clock.js";
import { LenientSlaScheduleValidator, defaultLenientSlaScheduleValidator } from "./lenient-sla-schedule-rules.js";
import { LenientSlaScheduleStore } from "./lenient-sla-schedule-store.js";

/** Moves lenient sla schedules through their life cycle and keeps a journal of what it did. */
export class LenientSlaScheduleDesk {
  store: LenientSlaScheduleStore;
  validator: LenientSlaScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientSlaScheduleStore,
    validator: LenientSlaScheduleValidator,
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
      throw new Error(`lenient sla schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient sla schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newLenientSlaScheduleDesk(store: LenientSlaScheduleStore, clockValue: clock.Clock): LenientSlaScheduleDesk {
  return new LenientSlaScheduleDesk(store, defaultLenientSlaScheduleValidator(), clockValue, []);
}
