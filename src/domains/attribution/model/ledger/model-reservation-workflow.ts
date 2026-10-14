import * as clock from "../../../../kit/clock.js";
import { ModelReservationEngine, defaultModelReservationEngine } from "./model-reservation-engine.js";
import { ModelReservationValidator, defaultModelReservationValidator } from "./model-reservation-rules.js";
import { ModelReservationStore } from "./model-reservation-store.js";

/** Moves model reservations through their life cycle and keeps a journal of what it did. */
export class ModelReservationService {
  store: ModelReservationStore;
  validator: ModelReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelReservationEngine;

  constructor(
    store: ModelReservationStore,
    validator: ModelReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelReservationEngine,
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
      throw new Error(`model reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model reservation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newModelReservationService(store: ModelReservationStore, clockValue: clock.Clock): ModelReservationService {
  return new ModelReservationService(
    store,
    defaultModelReservationValidator(),
    clockValue,
    [],
    defaultModelReservationEngine(),
  );
}
