import * as clock from "../../../../kit/clock.js";
import {
  DefaultRedemptionReservationEngine,
  defaultDefaultRedemptionReservationEngine,
} from "./default-redemption-reservation-engine.js";
import {
  DefaultRedemptionReservationValidator,
  defaultDefaultRedemptionReservationValidator,
} from "./default-redemption-reservation-rules.js";
import { DefaultRedemptionReservationStore } from "./default-redemption-reservation-store.js";

/** Moves default redemption reservations through their life cycle and keeps a journal of what it did. */
export class DefaultRedemptionReservationManager {
  store: DefaultRedemptionReservationStore;
  validator: DefaultRedemptionReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultRedemptionReservationEngine;

  constructor(
    store: DefaultRedemptionReservationStore,
    validator: DefaultRedemptionReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultRedemptionReservationEngine,
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
      throw new Error(`default redemption reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default redemption reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default redemption reservation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDefaultRedemptionReservationManager(store: DefaultRedemptionReservationStore, clockValue: clock.Clock): DefaultRedemptionReservationManager {
  return new DefaultRedemptionReservationManager(
    store,
    defaultDefaultRedemptionReservationValidator(),
    clockValue,
    [],
    defaultDefaultRedemptionReservationEngine(),
  );
}
