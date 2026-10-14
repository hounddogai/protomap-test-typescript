import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalChallengeReservationEngine,
  defaultRegionalChallengeReservationEngine,
} from "./regional-challenge-reservation-engine.js";
import {
  RegionalChallengeReservationValidator,
  defaultRegionalChallengeReservationValidator,
} from "./regional-challenge-reservation-rules.js";
import { RegionalChallengeReservationStore } from "./regional-challenge-reservation-store.js";

/** Moves regional challenge reservations through their life cycle and keeps a journal of what it did. */
export class RegionalChallengeReservationService {
  store: RegionalChallengeReservationStore;
  validator: RegionalChallengeReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalChallengeReservationEngine;

  constructor(
    store: RegionalChallengeReservationStore,
    validator: RegionalChallengeReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalChallengeReservationEngine,
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
      throw new Error(`regional challenge reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional challenge reservation ${code} not found`);
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
      throw new Error(`regional challenge reservation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRegionalChallengeReservationService(store: RegionalChallengeReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalChallengeReservationService {
  return new RegionalChallengeReservationService(
    store,
    defaultRegionalChallengeReservationValidator(),
    clockValue,
    [],
    defaultRegionalChallengeReservationEngine(flagsValue),
  );
}
