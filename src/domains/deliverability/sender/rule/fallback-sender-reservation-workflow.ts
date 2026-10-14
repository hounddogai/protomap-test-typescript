import * as clock from "../../../../kit/clock.js";
import {
  FallbackSenderReservationEngine,
  defaultFallbackSenderReservationEngine,
} from "./fallback-sender-reservation-engine.js";
import {
  FallbackSenderReservationValidator,
  defaultFallbackSenderReservationValidator,
} from "./fallback-sender-reservation-rules.js";
import { FallbackSenderReservationStore } from "./fallback-sender-reservation-store.js";

/** Moves fallback sender reservations through their life cycle and keeps a journal of what it did. */
export class FallbackSenderReservationManager {
  store: FallbackSenderReservationStore;
  validator: FallbackSenderReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackSenderReservationEngine;

  constructor(
    store: FallbackSenderReservationStore,
    validator: FallbackSenderReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackSenderReservationEngine,
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
      throw new Error(`fallback sender reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback sender reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback sender reservation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFallbackSenderReservationManager(store: FallbackSenderReservationStore, clockValue: clock.Clock): FallbackSenderReservationManager {
  return new FallbackSenderReservationManager(
    store,
    defaultFallbackSenderReservationValidator(),
    clockValue,
    [],
    defaultFallbackSenderReservationEngine(),
  );
}
