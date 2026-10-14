import * as clock from "../../../../kit/clock.js";
import { SlaReservationEngine, defaultSlaReservationEngine } from "./sla-reservation-engine.js";
import { SlaReservationValidator, defaultSlaReservationValidator } from "./sla-reservation-rules.js";
import { SlaReservationStore } from "./sla-reservation-store.js";

/** Moves sla reservations through their life cycle and keeps a journal of what it did. */
export class SlaReservationService {
  store: SlaReservationStore;
  validator: SlaReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaReservationEngine;

  constructor(
    store: SlaReservationStore,
    validator: SlaReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaReservationEngine,
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
      throw new Error(`sla reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla reservation ${code} not found`);
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

export function newSlaReservationService(store: SlaReservationStore, clockValue: clock.Clock): SlaReservationService {
  return new SlaReservationService(
    store,
    defaultSlaReservationValidator(),
    clockValue,
    [],
    defaultSlaReservationEngine(),
  );
}
