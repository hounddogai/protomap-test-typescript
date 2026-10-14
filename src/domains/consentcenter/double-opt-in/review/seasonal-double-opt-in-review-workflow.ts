import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalDoubleOptInReviewEngine,
  defaultSeasonalDoubleOptInReviewEngine,
} from "./seasonal-double-opt-in-review-engine.js";
import {
  SeasonalDoubleOptInReviewValidator,
  defaultSeasonalDoubleOptInReviewValidator,
} from "./seasonal-double-opt-in-review-rules.js";
import { SeasonalDoubleOptInReviewStore } from "./seasonal-double-opt-in-review-store.js";

/** Moves seasonal double opt in reviews through their life cycle and keeps a journal of what it did. */
export class SeasonalDoubleOptInReviewCoordinator {
  store: SeasonalDoubleOptInReviewStore;
  validator: SeasonalDoubleOptInReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalDoubleOptInReviewEngine;

  constructor(
    store: SeasonalDoubleOptInReviewStore,
    validator: SeasonalDoubleOptInReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalDoubleOptInReviewEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal double opt in review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal double opt in review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal double opt in review ${code} not found`);
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

export function newSeasonalDoubleOptInReviewCoordinator(store: SeasonalDoubleOptInReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalDoubleOptInReviewCoordinator {
  return new SeasonalDoubleOptInReviewCoordinator(
    store,
    defaultSeasonalDoubleOptInReviewValidator(),
    clockValue,
    [],
    defaultSeasonalDoubleOptInReviewEngine(flagsValue),
  );
}
