import * as clock from "../../../../kit/clock.js";
import { TieredPostReviewEngine, defaultTieredPostReviewEngine } from "./tiered-post-review-engine.js";
import { TieredPostReviewValidator, defaultTieredPostReviewValidator } from "./tiered-post-review-rules.js";
import { TieredPostReviewStore } from "./tiered-post-review-store.js";

/** Moves tiered post reviews through their life cycle and keeps a journal of what it did. */
export class TieredPostReviewCoordinator {
  store: TieredPostReviewStore;
  validator: TieredPostReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPostReviewEngine;

  constructor(
    store: TieredPostReviewStore,
    validator: TieredPostReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPostReviewEngine,
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
      throw new Error(`tiered post review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered post review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered post review ${code} not found`);
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

export function newTieredPostReviewCoordinator(store: TieredPostReviewStore, clockValue: clock.Clock): TieredPostReviewCoordinator {
  return new TieredPostReviewCoordinator(
    store,
    defaultTieredPostReviewValidator(),
    clockValue,
    [],
    defaultTieredPostReviewEngine(),
  );
}
