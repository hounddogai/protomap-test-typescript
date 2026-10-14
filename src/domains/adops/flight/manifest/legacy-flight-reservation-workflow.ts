import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyFlightReservationEngine,
  defaultLegacyFlightReservationEngine,
} from "./legacy-flight-reservation-engine.js";
import {
  LegacyFlightReservationValidator,
  defaultLegacyFlightReservationValidator,
} from "./legacy-flight-reservation-rules.js";
import { LegacyFlightReservationStore } from "./legacy-flight-reservation-store.js";

/** Moves legacy flight reservations through their life cycle and keeps a journal of what it did. */
export class LegacyFlightReservationManager {
  store: LegacyFlightReservationStore;
  validator: LegacyFlightReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyFlightReservationEngine;

  constructor(
    store: LegacyFlightReservationStore,
    validator: LegacyFlightReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyFlightReservationEngine,
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
      throw new Error(`legacy flight reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy flight reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy flight reservation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newLegacyFlightReservationManager(store: LegacyFlightReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyFlightReservationManager {
  return new LegacyFlightReservationManager(
    store,
    defaultLegacyFlightReservationValidator(),
    clockValue,
    [],
    defaultLegacyFlightReservationEngine(flagsValue),
  );
}
