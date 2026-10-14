import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackSuppressionReservationEngine,
  defaultFallbackSuppressionReservationEngine,
} from "./fallback-suppression-reservation-engine.js";
import {
  FallbackSuppressionReservationValidator,
  defaultFallbackSuppressionReservationValidator,
} from "./fallback-suppression-reservation-rules.js";
import { FallbackSuppressionReservationStore } from "./fallback-suppression-reservation-store.js";

/** Moves fallback suppression reservations through their life cycle and keeps a journal of what it did. */
export class FallbackSuppressionReservationDesk {
  store: FallbackSuppressionReservationStore;
  validator: FallbackSuppressionReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackSuppressionReservationEngine;

  constructor(
    store: FallbackSuppressionReservationStore,
    validator: FallbackSuppressionReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackSuppressionReservationEngine,
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
      throw new Error(`fallback suppression reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback suppression reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback suppression reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newFallbackSuppressionReservationDesk(store: FallbackSuppressionReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackSuppressionReservationDesk {
  return new FallbackSuppressionReservationDesk(
    store,
    defaultFallbackSuppressionReservationValidator(),
    clockValue,
    [],
    defaultFallbackSuppressionReservationEngine(flagsValue),
  );
}
