import * as clock from "../../../../kit/clock.js";
import { TouchpointScheduleEngine, defaultTouchpointScheduleEngine } from "./touchpoint-schedule-engine.js";
import { TouchpointScheduleValidator, defaultTouchpointScheduleValidator } from "./touchpoint-schedule-rules.js";
import { TouchpointScheduleStore } from "./touchpoint-schedule-store.js";

/** Moves touchpoint schedules through their life cycle and keeps a journal of what it did. */
export class TouchpointScheduleWorkflow {
  store: TouchpointScheduleStore;
  validator: TouchpointScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointScheduleEngine;

  constructor(
    store: TouchpointScheduleStore,
    validator: TouchpointScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointScheduleEngine,
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
      throw new Error(`touchpoint schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newTouchpointScheduleWorkflow(store: TouchpointScheduleStore, clockValue: clock.Clock): TouchpointScheduleWorkflow {
  return new TouchpointScheduleWorkflow(
    store,
    defaultTouchpointScheduleValidator(),
    clockValue,
    [],
    defaultTouchpointScheduleEngine(),
  );
}
