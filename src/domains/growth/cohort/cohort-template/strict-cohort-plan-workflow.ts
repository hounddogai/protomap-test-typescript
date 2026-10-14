import * as clock from "../../../../kit/clock.js";
import { StrictCohortPlanEngine, defaultStrictCohortPlanEngine } from "./strict-cohort-plan-engine.js";
import { StrictCohortPlanValidator, defaultStrictCohortPlanValidator } from "./strict-cohort-plan-rules.js";
import { StrictCohortPlanStore } from "./strict-cohort-plan-store.js";

/** Moves strict cohort plans through their life cycle and keeps a journal of what it did. */
export class StrictCohortPlanDesk {
  store: StrictCohortPlanStore;
  validator: StrictCohortPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictCohortPlanEngine;

  constructor(
    store: StrictCohortPlanStore,
    validator: StrictCohortPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictCohortPlanEngine,
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
      throw new Error(`strict cohort plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict cohort plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict cohort plan ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictCohortPlanDesk(store: StrictCohortPlanStore, clockValue: clock.Clock): StrictCohortPlanDesk {
  return new StrictCohortPlanDesk(
    store,
    defaultStrictCohortPlanValidator(),
    clockValue,
    [],
    defaultStrictCohortPlanEngine(),
  );
}
