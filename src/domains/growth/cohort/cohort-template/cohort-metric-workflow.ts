import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortMetricEngine, defaultCohortMetricEngine } from "./cohort-metric-engine.js";
import { CohortMetricValidator, defaultCohortMetricValidator } from "./cohort-metric-rules.js";
import { CohortMetricStore } from "./cohort-metric-store.js";

/** Moves cohort metrics through their life cycle and keeps a journal of what it did. */
export class CohortMetricManager {
  store: CohortMetricStore;
  validator: CohortMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortMetricEngine;

  constructor(
    store: CohortMetricStore,
    validator: CohortMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortMetricEngine,
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
      throw new Error(`cohort metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort metric ${code} not found`);
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

export function newCohortMetricManager(store: CohortMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortMetricManager {
  return new CohortMetricManager(
    store,
    defaultCohortMetricValidator(),
    clockValue,
    [],
    defaultCohortMetricEngine(flagsValue),
  );
}
