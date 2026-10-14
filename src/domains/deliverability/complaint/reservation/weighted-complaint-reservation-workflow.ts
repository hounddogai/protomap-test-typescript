import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedComplaintReservationEngine,
  defaultWeightedComplaintReservationEngine,
} from "./weighted-complaint-reservation-engine.js";
import {
  WeightedComplaintReservationValidator,
  defaultWeightedComplaintReservationValidator,
} from "./weighted-complaint-reservation-rules.js";
import { WeightedComplaintReservationStore } from "./weighted-complaint-reservation-store.js";

/** Moves weighted complaint reservations through their life cycle and keeps a journal of what it did. */
export class WeightedComplaintReservationCoordinator {
  store: WeightedComplaintReservationStore;
  validator: WeightedComplaintReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedComplaintReservationEngine;

  constructor(
    store: WeightedComplaintReservationStore,
    validator: WeightedComplaintReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedComplaintReservationEngine,
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
      throw new Error(`weighted complaint reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted complaint reservation ${code} not found`);
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
      throw new Error(`weighted complaint reservation ${code} not found`);
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

export function newWeightedComplaintReservationCoordinator(store: WeightedComplaintReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedComplaintReservationCoordinator {
  return new WeightedComplaintReservationCoordinator(
    store,
    defaultWeightedComplaintReservationValidator(),
    clockValue,
    [],
    defaultWeightedComplaintReservationEngine(flagsValue),
  );
}
