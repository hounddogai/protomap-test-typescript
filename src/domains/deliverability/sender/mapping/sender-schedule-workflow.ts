import * as clock from "../../../../kit/clock.js";
import { SenderScheduleValidator, defaultSenderScheduleValidator } from "./sender-schedule-rules.js";
import { SenderScheduleStore } from "./sender-schedule-store.js";

/** Moves sender schedules through their life cycle and keeps a journal of what it did. */
export class SenderScheduleWorkflow {
  store: SenderScheduleStore;
  validator: SenderScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SenderScheduleStore,
    validator: SenderScheduleValidator,
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
      throw new Error(`sender schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSenderScheduleWorkflow(store: SenderScheduleStore, clockValue: clock.Clock): SenderScheduleWorkflow {
  return new SenderScheduleWorkflow(store, defaultSenderScheduleValidator(), clockValue, []);
}
