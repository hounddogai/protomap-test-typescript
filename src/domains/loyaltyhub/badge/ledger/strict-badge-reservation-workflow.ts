import * as clock from "../../../../kit/clock.js";
import {
  StrictBadgeReservationEngine,
  defaultStrictBadgeReservationEngine,
} from "./strict-badge-reservation-engine.js";
import {
  StrictBadgeReservationValidator,
  defaultStrictBadgeReservationValidator,
} from "./strict-badge-reservation-rules.js";
import { StrictBadgeReservationStore } from "./strict-badge-reservation-store.js";

/** Moves strict badge reservations through their life cycle and keeps a journal of what it did. */
export class StrictBadgeReservationManager {
  store: StrictBadgeReservationStore;
  validator: StrictBadgeReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictBadgeReservationEngine;

  constructor(
    store: StrictBadgeReservationStore,
    validator: StrictBadgeReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictBadgeReservationEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict badge reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict badge reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict badge reservation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newStrictBadgeReservationManager(store: StrictBadgeReservationStore, clockValue: clock.Clock): StrictBadgeReservationManager {
  return new StrictBadgeReservationManager(
    store,
    defaultStrictBadgeReservationValidator(),
    clockValue,
    [],
    defaultStrictBadgeReservationEngine(),
  );
}
