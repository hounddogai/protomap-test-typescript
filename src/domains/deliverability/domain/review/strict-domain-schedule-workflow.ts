import * as clock from "../../../../kit/clock.js";
import {
  StrictDomainScheduleValidator,
  defaultStrictDomainScheduleValidator,
} from "./strict-domain-schedule-rules.js";
import { StrictDomainScheduleStore } from "./strict-domain-schedule-store.js";

/** Moves strict domain schedules through their life cycle and keeps a journal of what it did. */
export class StrictDomainScheduleService {
  store: StrictDomainScheduleStore;
  validator: StrictDomainScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictDomainScheduleStore,
    validator: StrictDomainScheduleValidator,
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
      throw new Error(`strict domain schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict domain schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newStrictDomainScheduleService(store: StrictDomainScheduleStore, clockValue: clock.Clock): StrictDomainScheduleService {
  return new StrictDomainScheduleService(store, defaultStrictDomainScheduleValidator(), clockValue, []);
}
