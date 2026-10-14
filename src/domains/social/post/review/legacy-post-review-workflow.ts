import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyPostReviewEngine, defaultLegacyPostReviewEngine } from "./legacy-post-review-engine.js";
import { LegacyPostReviewValidator, defaultLegacyPostReviewValidator } from "./legacy-post-review-rules.js";
import { LegacyPostReviewStore } from "./legacy-post-review-store.js";

/** Moves legacy post reviews through their life cycle and keeps a journal of what it did. */
export class LegacyPostReviewService {
  store: LegacyPostReviewStore;
  validator: LegacyPostReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPostReviewEngine;

  constructor(
    store: LegacyPostReviewStore,
    validator: LegacyPostReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPostReviewEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy post review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy post review ${code} not found`);
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
      throw new Error(`legacy post review ${code} not found`);
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

export function newLegacyPostReviewService(store: LegacyPostReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyPostReviewService {
  return new LegacyPostReviewService(
    store,
    defaultLegacyPostReviewValidator(),
    clockValue,
    [],
    defaultLegacyPostReviewEngine(flagsValue),
  );
}
