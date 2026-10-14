import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WindowScheduleEngine, defaultWindowScheduleEngine } from "./window-schedule-engine.js";
import { WindowScheduleValidator, defaultWindowScheduleValidator } from "./window-schedule-rules.js";
import { WindowScheduleStore } from "./window-schedule-store.js";

/** Moves window schedules through their life cycle and keeps a journal of what it did. */
export class WindowScheduleWorkflow {
  store: WindowScheduleStore;
  validator: WindowScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowScheduleEngine;

  constructor(
    store: WindowScheduleStore,
    validator: WindowScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowScheduleEngine,
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
      throw new Error(`window schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window schedule ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWindowScheduleWorkflow(store: WindowScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): WindowScheduleWorkflow {
  return new WindowScheduleWorkflow(
    store,
    defaultWindowScheduleValidator(),
    clockValue,
    [],
    defaultWindowScheduleEngine(flagsValue),
  );
}
