import * as clock from "../../../../kit/clock.js";
import { DoubleOptInScheduleEngine, defaultDoubleOptInScheduleEngine } from "./double-opt-in-schedule-engine.js";
import { DoubleOptInScheduleValidator, defaultDoubleOptInScheduleValidator } from "./double-opt-in-schedule-rules.js";
import { DoubleOptInScheduleStore } from "./double-opt-in-schedule-store.js";

/** Moves double opt in schedules through their life cycle and keeps a journal of what it did. */
export class DoubleOptInScheduleWorkflow {
  store: DoubleOptInScheduleStore;
  validator: DoubleOptInScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInScheduleEngine;

  constructor(
    store: DoubleOptInScheduleStore,
    validator: DoubleOptInScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInScheduleEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newDoubleOptInScheduleWorkflow(store: DoubleOptInScheduleStore, clockValue: clock.Clock): DoubleOptInScheduleWorkflow {
  return new DoubleOptInScheduleWorkflow(
    store,
    defaultDoubleOptInScheduleValidator(),
    clockValue,
    [],
    defaultDoubleOptInScheduleEngine(),
  );
}
