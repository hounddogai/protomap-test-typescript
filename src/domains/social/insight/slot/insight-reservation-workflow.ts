import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightReservationEngine, defaultInsightReservationEngine } from "./insight-reservation-engine.js";
import { InsightReservationValidator, defaultInsightReservationValidator } from "./insight-reservation-rules.js";
import { InsightReservationStore } from "./insight-reservation-store.js";

/** Moves insight reservations through their life cycle and keeps a journal of what it did. */
export class InsightReservationManager {
  store: InsightReservationStore;
  validator: InsightReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightReservationEngine;

  constructor(
    store: InsightReservationStore,
    validator: InsightReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightReservationEngine,
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
      throw new Error(`insight reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight reservation ${code} not found`);
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
      throw new Error(`insight reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInsightReservationManager(store: InsightReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightReservationManager {
  return new InsightReservationManager(
    store,
    defaultInsightReservationValidator(),
    clockValue,
    [],
    defaultInsightReservationEngine(flagsValue),
  );
}
