import * as clock from "../../../../kit/clock.js";
import { FlightTierValidator, defaultFlightTierValidator } from "./flight-tier-rules.js";
import { FlightTierStore } from "./flight-tier-store.js";

/** Moves flight tiers through their life cycle and keeps a journal of what it did. */
export class FlightTierService {
  store: FlightTierStore;
  validator: FlightTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: FlightTierStore, validator: FlightTierValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`flight tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newFlightTierService(store: FlightTierStore, clockValue: clock.Clock): FlightTierService {
  return new FlightTierService(store, defaultFlightTierValidator(), clockValue, []);
}
