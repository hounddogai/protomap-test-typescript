import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FraudCheckReservationEngine, defaultFraudCheckReservationEngine } from "./fraud-check-reservation-engine.js";
import {
  FraudCheckReservationValidator,
  defaultFraudCheckReservationValidator,
} from "./fraud-check-reservation-rules.js";
import { FraudCheckReservationStore } from "./fraud-check-reservation-store.js";

/** Moves fraud check reservations through their life cycle and keeps a journal of what it did. */
export class FraudCheckReservationCoordinator {
  store: FraudCheckReservationStore;
  validator: FraudCheckReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckReservationEngine;

  constructor(
    store: FraudCheckReservationStore,
    validator: FraudCheckReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckReservationEngine,
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
      throw new Error(`fraud check reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check reservation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newFraudCheckReservationCoordinator(store: FraudCheckReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): FraudCheckReservationCoordinator {
  return new FraudCheckReservationCoordinator(
    store,
    defaultFraudCheckReservationValidator(),
    clockValue,
    [],
    defaultFraudCheckReservationEngine(flagsValue),
  );
}
