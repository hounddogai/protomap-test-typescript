import * as clock from "../../../../kit/clock.js";
import { ReputationReservationEngine, defaultReputationReservationEngine } from "./reputation-reservation-engine.js";
import {
  ReputationReservationValidator,
  defaultReputationReservationValidator,
} from "./reputation-reservation-rules.js";
import { ReputationReservationStore } from "./reputation-reservation-store.js";

/** Moves reputation reservations through their life cycle and keeps a journal of what it did. */
export class ReputationReservationCoordinator {
  store: ReputationReservationStore;
  validator: ReputationReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationReservationEngine;

  constructor(
    store: ReputationReservationStore,
    validator: ReputationReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationReservationEngine,
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
      throw new Error(`reputation reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation reservation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newReputationReservationCoordinator(store: ReputationReservationStore, clockValue: clock.Clock): ReputationReservationCoordinator {
  return new ReputationReservationCoordinator(
    store,
    defaultReputationReservationValidator(),
    clockValue,
    [],
    defaultReputationReservationEngine(),
  );
}
