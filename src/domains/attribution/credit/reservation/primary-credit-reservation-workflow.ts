import * as clock from "../../../../kit/clock.js";
import {
  PrimaryCreditReservationValidator,
  defaultPrimaryCreditReservationValidator,
} from "./primary-credit-reservation-rules.js";
import { PrimaryCreditReservationStore } from "./primary-credit-reservation-store.js";

/** Moves primary credit reservations through their life cycle and keeps a journal of what it did. */
export class PrimaryCreditReservationService {
  store: PrimaryCreditReservationStore;
  validator: PrimaryCreditReservationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryCreditReservationStore,
    validator: PrimaryCreditReservationValidator,
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
      throw new Error(`primary credit reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary credit reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryCreditReservationService(store: PrimaryCreditReservationStore, clockValue: clock.Clock): PrimaryCreditReservationService {
  return new PrimaryCreditReservationService(store, defaultPrimaryCreditReservationValidator(), clockValue, []);
}
