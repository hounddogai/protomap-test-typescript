import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientWarmupReviewEngine, defaultLenientWarmupReviewEngine } from "./lenient-warmup-review-engine.js";
import { LenientWarmupReviewValidator, defaultLenientWarmupReviewValidator } from "./lenient-warmup-review-rules.js";
import { LenientWarmupReviewStore } from "./lenient-warmup-review-store.js";

/** Moves lenient warmup reviews through their life cycle and keeps a journal of what it did. */
export class LenientWarmupReviewService {
  store: LenientWarmupReviewStore;
  validator: LenientWarmupReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientWarmupReviewEngine;

  constructor(
    store: LenientWarmupReviewStore,
    validator: LenientWarmupReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientWarmupReviewEngine,
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
      throw new Error(`lenient warmup review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newLenientWarmupReviewService(store: LenientWarmupReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientWarmupReviewService {
  return new LenientWarmupReviewService(
    store,
    defaultLenientWarmupReviewValidator(),
    clockValue,
    [],
    defaultLenientWarmupReviewEngine(flagsValue),
  );
}
