import * as clock from "../../../../kit/clock.js";
import {
  SuppressionReservationEngine,
  defaultSuppressionReservationEngine,
} from "./suppression-reservation-engine.js";
import {
  SuppressionReservationValidator,
  defaultSuppressionReservationValidator,
} from "./suppression-reservation-rules.js";
import { SuppressionReservationStore } from "./suppression-reservation-store.js";

/** Moves suppression reservations through their life cycle and keeps a journal of what it did. */
export class SuppressionReservationWorkflow {
  store: SuppressionReservationStore;
  validator: SuppressionReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SuppressionReservationEngine;

  constructor(
    store: SuppressionReservationStore,
    validator: SuppressionReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SuppressionReservationEngine,
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
      throw new Error(`suppression reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSuppressionReservationWorkflow(store: SuppressionReservationStore, clockValue: clock.Clock): SuppressionReservationWorkflow {
  return new SuppressionReservationWorkflow(
    store,
    defaultSuppressionReservationValidator(),
    clockValue,
    [],
    defaultSuppressionReservationEngine(),
  );
}
