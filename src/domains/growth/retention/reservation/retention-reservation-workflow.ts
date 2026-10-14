import * as clock from "../../../../kit/clock.js";
import { RetentionReservationEngine, defaultRetentionReservationEngine } from "./retention-reservation-engine.js";
import {
  RetentionReservationValidator,
  defaultRetentionReservationValidator,
} from "./retention-reservation-rules.js";
import { RetentionReservationStore } from "./retention-reservation-store.js";

/** Moves retention reservations through their life cycle and keeps a journal of what it did. */
export class RetentionReservationManager {
  store: RetentionReservationStore;
  validator: RetentionReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionReservationEngine;

  constructor(
    store: RetentionReservationStore,
    validator: RetentionReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionReservationEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention reservation ${code} not found`);
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
      throw new Error(`retention reservation ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRetentionReservationManager(store: RetentionReservationStore, clockValue: clock.Clock): RetentionReservationManager {
  return new RetentionReservationManager(
    store,
    defaultRetentionReservationValidator(),
    clockValue,
    [],
    defaultRetentionReservationEngine(),
  );
}
