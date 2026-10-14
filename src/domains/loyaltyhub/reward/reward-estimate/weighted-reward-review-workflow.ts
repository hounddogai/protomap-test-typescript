import * as clock from "../../../../kit/clock.js";
import { WeightedRewardReviewEngine, defaultWeightedRewardReviewEngine } from "./weighted-reward-review-engine.js";
import {
  WeightedRewardReviewValidator,
  defaultWeightedRewardReviewValidator,
} from "./weighted-reward-review-rules.js";
import { WeightedRewardReviewStore } from "./weighted-reward-review-store.js";

/** Moves weighted reward reviews through their life cycle and keeps a journal of what it did. */
export class WeightedRewardReviewService {
  store: WeightedRewardReviewStore;
  validator: WeightedRewardReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedRewardReviewEngine;

  constructor(
    store: WeightedRewardReviewStore,
    validator: WeightedRewardReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedRewardReviewEngine,
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
      throw new Error(`weighted reward review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newWeightedRewardReviewService(store: WeightedRewardReviewStore, clockValue: clock.Clock): WeightedRewardReviewService {
  return new WeightedRewardReviewService(
    store,
    defaultWeightedRewardReviewValidator(),
    clockValue,
    [],
    defaultWeightedRewardReviewEngine(),
  );
}
