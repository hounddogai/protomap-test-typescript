import * as clock from "../../../../kit/clock.js";
import {
  PendingActivationScheduleValidator,
  defaultPendingActivationScheduleValidator,
} from "./pending-activation-schedule-rules.js";
import { PendingActivationScheduleStore } from "./pending-activation-schedule-store.js";

/** Moves pending activation schedules through their life cycle and keeps a journal of what it did. */
export class PendingActivationScheduleWorkflow {
  store: PendingActivationScheduleStore;
  validator: PendingActivationScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingActivationScheduleStore,
    validator: PendingActivationScheduleValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending activation schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending activation schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newPendingActivationScheduleWorkflow(store: PendingActivationScheduleStore, clockValue: clock.Clock): PendingActivationScheduleWorkflow {
  return new PendingActivationScheduleWorkflow(store, defaultPendingActivationScheduleValidator(), clockValue, []);
}
