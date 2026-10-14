import * as clock from "../../../../kit/clock.js";
import {
  LenientOptOutScheduleValidator,
  defaultLenientOptOutScheduleValidator,
} from "./lenient-opt-out-schedule-rules.js";
import { LenientOptOutScheduleStore } from "./lenient-opt-out-schedule-store.js";

/** Moves lenient opt out schedules through their life cycle and keeps a journal of what it did. */
export class LenientOptOutScheduleCoordinator {
  store: LenientOptOutScheduleStore;
  validator: LenientOptOutScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientOptOutScheduleStore,
    validator: LenientOptOutScheduleValidator,
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
      throw new Error(`lenient opt out schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient opt out schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newLenientOptOutScheduleCoordinator(store: LenientOptOutScheduleStore, clockValue: clock.Clock): LenientOptOutScheduleCoordinator {
  return new LenientOptOutScheduleCoordinator(store, defaultLenientOptOutScheduleValidator(), clockValue, []);
}
