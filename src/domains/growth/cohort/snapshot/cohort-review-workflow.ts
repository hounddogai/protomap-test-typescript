import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortReviewEngine, defaultCohortReviewEngine } from "./cohort-review-engine.js";
import { CohortReviewValidator, defaultCohortReviewValidator } from "./cohort-review-rules.js";
import { CohortReviewStore } from "./cohort-review-store.js";

/** Moves cohort reviews through their life cycle and keeps a journal of what it did. */
export class CohortReviewWorkflow {
  store: CohortReviewStore;
  validator: CohortReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortReviewEngine;

  constructor(
    store: CohortReviewStore,
    validator: CohortReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortReviewEngine,
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
      throw new Error(`cohort review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort review ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newCohortReviewWorkflow(store: CohortReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortReviewWorkflow {
  return new CohortReviewWorkflow(
    store,
    defaultCohortReviewValidator(),
    clockValue,
    [],
    defaultCohortReviewEngine(flagsValue),
  );
}
