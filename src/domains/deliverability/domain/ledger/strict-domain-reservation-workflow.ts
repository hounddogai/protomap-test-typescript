import * as clock from "../../../../kit/clock.js";
import {
  StrictDomainReservationValidator,
  defaultStrictDomainReservationValidator,
} from "./strict-domain-reservation-rules.js";
import { StrictDomainReservationStore } from "./strict-domain-reservation-store.js";

/** Moves strict domain reservations through their life cycle and keeps a journal of what it did. */
export class StrictDomainReservationWorkflow {
  store: StrictDomainReservationStore;
  validator: StrictDomainReservationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictDomainReservationStore,
    validator: StrictDomainReservationValidator,
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
      throw new Error(`strict domain reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict domain reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newStrictDomainReservationWorkflow(store: StrictDomainReservationStore, clockValue: clock.Clock): StrictDomainReservationWorkflow {
  return new StrictDomainReservationWorkflow(store, defaultStrictDomainReservationValidator(), clockValue, []);
}
