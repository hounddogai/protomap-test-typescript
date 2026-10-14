import * as clock from "../../../../kit/clock.js";
import {
  StrictCohortAssignmentEngine,
  defaultStrictCohortAssignmentEngine,
} from "./strict-cohort-assignment-engine.js";
import {
  StrictCohortAssignmentValidator,
  defaultStrictCohortAssignmentValidator,
} from "./strict-cohort-assignment-rules.js";
import { StrictCohortAssignmentStore } from "./strict-cohort-assignment-store.js";

/** Moves strict cohort assignments through their life cycle and keeps a journal of what it did. */
export class StrictCohortAssignmentDesk {
  store: StrictCohortAssignmentStore;
  validator: StrictCohortAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictCohortAssignmentEngine;

  constructor(
    store: StrictCohortAssignmentStore,
    validator: StrictCohortAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictCohortAssignmentEngine,
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
      throw new Error(`strict cohort assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict cohort assignment ${code} not found`);
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
      throw new Error(`strict cohort assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictCohortAssignmentDesk(store: StrictCohortAssignmentStore, clockValue: clock.Clock): StrictCohortAssignmentDesk {
  return new StrictCohortAssignmentDesk(
    store,
    defaultStrictCohortAssignmentValidator(),
    clockValue,
    [],
    defaultStrictCohortAssignmentEngine(),
  );
}
