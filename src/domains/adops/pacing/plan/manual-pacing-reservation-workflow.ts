import * as clock from "../../../../kit/clock.js";
import {
  ManualPacingReservationEngine,
  defaultManualPacingReservationEngine,
} from "./manual-pacing-reservation-engine.js";
import {
  ManualPacingReservationValidator,
  defaultManualPacingReservationValidator,
} from "./manual-pacing-reservation-rules.js";
import { ManualPacingReservationStore } from "./manual-pacing-reservation-store.js";

/** Moves manual pacing reservations through their life cycle and keeps a journal of what it did. */
export class ManualPacingReservationWorkflow {
  store: ManualPacingReservationStore;
  validator: ManualPacingReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualPacingReservationEngine;

  constructor(
    store: ManualPacingReservationStore,
    validator: ManualPacingReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualPacingReservationEngine,
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
      throw new Error(`manual pacing reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual pacing reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual pacing reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newManualPacingReservationWorkflow(store: ManualPacingReservationStore, clockValue: clock.Clock): ManualPacingReservationWorkflow {
  return new ManualPacingReservationWorkflow(
    store,
    defaultManualPacingReservationValidator(),
    clockValue,
    [],
    defaultManualPacingReservationEngine(),
  );
}
