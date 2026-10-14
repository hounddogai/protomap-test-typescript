import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualDeflectionReservationEngine,
  defaultManualDeflectionReservationEngine,
} from "./manual-deflection-reservation-engine.js";
import {
  ManualDeflectionReservationValidator,
  defaultManualDeflectionReservationValidator,
} from "./manual-deflection-reservation-rules.js";
import { ManualDeflectionReservationStore } from "./manual-deflection-reservation-store.js";

/** Moves manual deflection reservations through their life cycle and keeps a journal of what it did. */
export class ManualDeflectionReservationService {
  store: ManualDeflectionReservationStore;
  validator: ManualDeflectionReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualDeflectionReservationEngine;

  constructor(
    store: ManualDeflectionReservationStore,
    validator: ManualDeflectionReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualDeflectionReservationEngine,
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
      throw new Error(`manual deflection reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual deflection reservation ${code} not found`);
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
      throw new Error(`manual deflection reservation ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newManualDeflectionReservationService(store: ManualDeflectionReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualDeflectionReservationService {
  return new ManualDeflectionReservationService(
    store,
    defaultManualDeflectionReservationValidator(),
    clockValue,
    [],
    defaultManualDeflectionReservationEngine(flagsValue),
  );
}
