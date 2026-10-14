import * as clock from "../../../../kit/clock.js";
import {
  PrimaryTicketViewScheduleValidator,
  defaultPrimaryTicketViewScheduleValidator,
} from "./primary-ticket-view-schedule-rules.js";
import { PrimaryTicketViewScheduleStore } from "./primary-ticket-view-schedule-store.js";

/** Moves primary ticket view schedules through their life cycle and keeps a journal of what it did. */
export class PrimaryTicketViewScheduleManager {
  store: PrimaryTicketViewScheduleStore;
  validator: PrimaryTicketViewScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryTicketViewScheduleStore,
    validator: PrimaryTicketViewScheduleValidator,
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
      throw new Error(`primary ticket view schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary ticket view schedule ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryTicketViewScheduleManager(store: PrimaryTicketViewScheduleStore, clockValue: clock.Clock): PrimaryTicketViewScheduleManager {
  return new PrimaryTicketViewScheduleManager(store, defaultPrimaryTicketViewScheduleValidator(), clockValue, []);
}
