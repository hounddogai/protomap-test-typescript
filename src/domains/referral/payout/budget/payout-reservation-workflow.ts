import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PayoutReservationEngine, defaultPayoutReservationEngine } from "./payout-reservation-engine.js";
import { PayoutReservationValidator, defaultPayoutReservationValidator } from "./payout-reservation-rules.js";
import { PayoutReservationStore } from "./payout-reservation-store.js";

/** Moves payout reservations through their life cycle and keeps a journal of what it did. */
export class PayoutReservationDesk {
  store: PayoutReservationStore;
  validator: PayoutReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PayoutReservationEngine;

  constructor(
    store: PayoutReservationStore,
    validator: PayoutReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PayoutReservationEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout reservation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPayoutReservationDesk(store: PayoutReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): PayoutReservationDesk {
  return new PayoutReservationDesk(
    store,
    defaultPayoutReservationValidator(),
    clockValue,
    [],
    defaultPayoutReservationEngine(flagsValue),
  );
}
