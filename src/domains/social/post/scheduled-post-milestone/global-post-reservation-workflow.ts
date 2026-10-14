import * as clock from "../../../../kit/clock.js";
import { GlobalPostReservationEngine, defaultGlobalPostReservationEngine } from "./global-post-reservation-engine.js";
import {
  GlobalPostReservationValidator,
  defaultGlobalPostReservationValidator,
} from "./global-post-reservation-rules.js";
import { GlobalPostReservationStore } from "./global-post-reservation-store.js";

/** Moves global post reservations through their life cycle and keeps a journal of what it did. */
export class GlobalPostReservationCoordinator {
  store: GlobalPostReservationStore;
  validator: GlobalPostReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalPostReservationEngine;

  constructor(
    store: GlobalPostReservationStore,
    validator: GlobalPostReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalPostReservationEngine,
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
      throw new Error(`global post reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global post reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global post reservation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newGlobalPostReservationCoordinator(store: GlobalPostReservationStore, clockValue: clock.Clock): GlobalPostReservationCoordinator {
  return new GlobalPostReservationCoordinator(
    store,
    defaultGlobalPostReservationValidator(),
    clockValue,
    [],
    defaultGlobalPostReservationEngine(),
  );
}
