import * as clock from "../../../../kit/clock.js";
import {
  LegacyWindowReservationEngine,
  defaultLegacyWindowReservationEngine,
} from "./legacy-window-reservation-engine.js";
import {
  LegacyWindowReservationValidator,
  defaultLegacyWindowReservationValidator,
} from "./legacy-window-reservation-rules.js";
import { LegacyWindowReservationStore } from "./legacy-window-reservation-store.js";

/** Moves legacy window reservations through their life cycle and keeps a journal of what it did. */
export class LegacyWindowReservationWorkflow {
  store: LegacyWindowReservationStore;
  validator: LegacyWindowReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyWindowReservationEngine;

  constructor(
    store: LegacyWindowReservationStore,
    validator: LegacyWindowReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyWindowReservationEngine,
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
      throw new Error(`legacy window reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy window reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy window reservation ${code} not found`);
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

export function newLegacyWindowReservationWorkflow(store: LegacyWindowReservationStore, clockValue: clock.Clock): LegacyWindowReservationWorkflow {
  return new LegacyWindowReservationWorkflow(
    store,
    defaultLegacyWindowReservationValidator(),
    clockValue,
    [],
    defaultLegacyWindowReservationEngine(),
  );
}
