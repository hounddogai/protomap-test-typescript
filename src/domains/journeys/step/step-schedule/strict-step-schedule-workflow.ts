import * as clock from "../../../../kit/clock.js";
import { StrictStepScheduleEngine, defaultStrictStepScheduleEngine } from "./strict-step-schedule-engine.js";
import { StrictStepScheduleValidator, defaultStrictStepScheduleValidator } from "./strict-step-schedule-rules.js";
import { StrictStepScheduleStore } from "./strict-step-schedule-store.js";

/** Moves strict step schedules through their life cycle and keeps a journal of what it did. */
export class StrictStepScheduleDesk {
  store: StrictStepScheduleStore;
  validator: StrictStepScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictStepScheduleEngine;

  constructor(
    store: StrictStepScheduleStore,
    validator: StrictStepScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictStepScheduleEngine,
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
      throw new Error(`strict step schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict step schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict step schedule ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictStepScheduleDesk(store: StrictStepScheduleStore, clockValue: clock.Clock): StrictStepScheduleDesk {
  return new StrictStepScheduleDesk(
    store,
    defaultStrictStepScheduleValidator(),
    clockValue,
    [],
    defaultStrictStepScheduleEngine(),
  );
}
