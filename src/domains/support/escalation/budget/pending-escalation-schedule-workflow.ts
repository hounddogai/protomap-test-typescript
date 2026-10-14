import * as clock from "../../../../kit/clock.js";
import {
  PendingEscalationScheduleValidator,
  defaultPendingEscalationScheduleValidator,
} from "./pending-escalation-schedule-rules.js";
import { PendingEscalationScheduleStore } from "./pending-escalation-schedule-store.js";

/** Moves pending escalation schedules through their life cycle and keeps a journal of what it did. */
export class PendingEscalationScheduleManager {
  store: PendingEscalationScheduleStore;
  validator: PendingEscalationScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingEscalationScheduleStore,
    validator: PendingEscalationScheduleValidator,
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
      throw new Error(`pending escalation schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending escalation schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newPendingEscalationScheduleManager(store: PendingEscalationScheduleStore, clockValue: clock.Clock): PendingEscalationScheduleManager {
  return new PendingEscalationScheduleManager(store, defaultPendingEscalationScheduleValidator(), clockValue, []);
}
