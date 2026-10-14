import * as clock from "../../../../kit/clock.js";
import {
  PrimaryActivationReservationEngine,
  defaultPrimaryActivationReservationEngine,
} from "./primary-activation-reservation-engine.js";
import {
  PrimaryActivationReservationValidator,
  defaultPrimaryActivationReservationValidator,
} from "./primary-activation-reservation-rules.js";
import { PrimaryActivationReservationStore } from "./primary-activation-reservation-store.js";

/** Moves primary activation reservations through their life cycle and keeps a journal of what it did. */
export class PrimaryActivationReservationDesk {
  store: PrimaryActivationReservationStore;
  validator: PrimaryActivationReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryActivationReservationEngine;

  constructor(
    store: PrimaryActivationReservationStore,
    validator: PrimaryActivationReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryActivationReservationEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary activation reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary activation reservation ${code} not found`);
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
      throw new Error(`primary activation reservation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPrimaryActivationReservationDesk(store: PrimaryActivationReservationStore, clockValue: clock.Clock): PrimaryActivationReservationDesk {
  return new PrimaryActivationReservationDesk(
    store,
    defaultPrimaryActivationReservationValidator(),
    clockValue,
    [],
    defaultPrimaryActivationReservationEngine(),
  );
}
