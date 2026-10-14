import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ConversionScheduleEngine, defaultConversionScheduleEngine } from "./conversion-schedule-engine.js";
import { ConversionScheduleValidator, defaultConversionScheduleValidator } from "./conversion-schedule-rules.js";
import { ConversionScheduleStore } from "./conversion-schedule-store.js";

/** Moves conversion schedules through their life cycle and keeps a journal of what it did. */
export class ConversionScheduleDesk {
  store: ConversionScheduleStore;
  validator: ConversionScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionScheduleEngine;

  constructor(
    store: ConversionScheduleStore,
    validator: ConversionScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionScheduleEngine,
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
      throw new Error(`conversion schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion schedule ${code} not found`);
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

export function newConversionScheduleDesk(store: ConversionScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ConversionScheduleDesk {
  return new ConversionScheduleDesk(
    store,
    defaultConversionScheduleValidator(),
    clockValue,
    [],
    defaultConversionScheduleEngine(flagsValue),
  );
}
