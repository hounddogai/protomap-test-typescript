import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryWarmupReviewEngine, defaultPrimaryWarmupReviewEngine } from "./primary-warmup-review-engine.js";
import { PrimaryWarmupReviewValidator, defaultPrimaryWarmupReviewValidator } from "./primary-warmup-review-rules.js";
import { PrimaryWarmupReviewStore } from "./primary-warmup-review-store.js";

/** Moves primary warmup reviews through their life cycle and keeps a journal of what it did. */
export class PrimaryWarmupReviewManager {
  store: PrimaryWarmupReviewStore;
  validator: PrimaryWarmupReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryWarmupReviewEngine;

  constructor(
    store: PrimaryWarmupReviewStore,
    validator: PrimaryWarmupReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryWarmupReviewEngine,
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
      throw new Error(`primary warmup review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary warmup review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary warmup review ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPrimaryWarmupReviewManager(store: PrimaryWarmupReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryWarmupReviewManager {
  return new PrimaryWarmupReviewManager(
    store,
    defaultPrimaryWarmupReviewValidator(),
    clockValue,
    [],
    defaultPrimaryWarmupReviewEngine(flagsValue),
  );
}
