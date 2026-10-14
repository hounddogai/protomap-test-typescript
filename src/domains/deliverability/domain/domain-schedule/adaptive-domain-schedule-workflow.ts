import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveDomainScheduleValidator,
  defaultAdaptiveDomainScheduleValidator,
} from "./adaptive-domain-schedule-rules.js";
import { AdaptiveDomainScheduleStore } from "./adaptive-domain-schedule-store.js";

/** Moves adaptive domain schedules through their life cycle and keeps a journal of what it did. */
export class AdaptiveDomainScheduleWorkflow {
  store: AdaptiveDomainScheduleStore;
  validator: AdaptiveDomainScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveDomainScheduleStore,
    validator: AdaptiveDomainScheduleValidator,
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
      throw new Error(`adaptive domain schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain schedule ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveDomainScheduleWorkflow(store: AdaptiveDomainScheduleStore, clockValue: clock.Clock): AdaptiveDomainScheduleWorkflow {
  return new AdaptiveDomainScheduleWorkflow(store, defaultAdaptiveDomainScheduleValidator(), clockValue, []);
}
