import * as clock from "../../../../kit/clock.js";
import { CohortScheduleEngine, defaultCohortScheduleEngine } from "./cohort-schedule-engine.js";
import { CohortScheduleValidator, defaultCohortScheduleValidator } from "./cohort-schedule-rules.js";
import { CohortScheduleStore } from "./cohort-schedule-store.js";

/** Moves cohort schedules through their life cycle and keeps a journal of what it did. */
export class CohortScheduleWorkflow {
  store: CohortScheduleStore;
  validator: CohortScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortScheduleEngine;

  constructor(
    store: CohortScheduleStore,
    validator: CohortScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortScheduleEngine,
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
      throw new Error(`cohort schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCohortScheduleWorkflow(store: CohortScheduleStore, clockValue: clock.Clock): CohortScheduleWorkflow {
  return new CohortScheduleWorkflow(
    store,
    defaultCohortScheduleValidator(),
    clockValue,
    [],
    defaultCohortScheduleEngine(),
  );
}
