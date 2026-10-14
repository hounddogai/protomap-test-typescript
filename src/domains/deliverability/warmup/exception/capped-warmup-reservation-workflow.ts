import * as clock from "../../../../kit/clock.js";
import {
  CappedWarmupReservationEngine,
  defaultCappedWarmupReservationEngine,
} from "./capped-warmup-reservation-engine.js";
import {
  CappedWarmupReservationValidator,
  defaultCappedWarmupReservationValidator,
} from "./capped-warmup-reservation-rules.js";
import { CappedWarmupReservationStore } from "./capped-warmup-reservation-store.js";

/** Moves capped warmup reservations through their life cycle and keeps a journal of what it did. */
export class CappedWarmupReservationCoordinator {
  store: CappedWarmupReservationStore;
  validator: CappedWarmupReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedWarmupReservationEngine;

  constructor(
    store: CappedWarmupReservationStore,
    validator: CappedWarmupReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedWarmupReservationEngine,
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
      throw new Error(`capped warmup reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped warmup reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped warmup reservation ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newCappedWarmupReservationCoordinator(store: CappedWarmupReservationStore, clockValue: clock.Clock): CappedWarmupReservationCoordinator {
  return new CappedWarmupReservationCoordinator(
    store,
    defaultCappedWarmupReservationValidator(),
    clockValue,
    [],
    defaultCappedWarmupReservationEngine(),
  );
}
