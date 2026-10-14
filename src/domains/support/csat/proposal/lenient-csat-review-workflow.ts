import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientCsatReviewEngine, defaultLenientCsatReviewEngine } from "./lenient-csat-review-engine.js";
import { LenientCsatReviewValidator, defaultLenientCsatReviewValidator } from "./lenient-csat-review-rules.js";
import { LenientCsatReviewStore } from "./lenient-csat-review-store.js";

/** Moves lenient csat reviews through their life cycle and keeps a journal of what it did. */
export class LenientCsatReviewManager {
  store: LenientCsatReviewStore;
  validator: LenientCsatReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientCsatReviewEngine;

  constructor(
    store: LenientCsatReviewStore,
    validator: LenientCsatReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientCsatReviewEngine,
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
      throw new Error(`lenient csat review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient csat review ${code} not found`);
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
      throw new Error(`lenient csat review ${code} not found`);
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

export function newLenientCsatReviewManager(store: LenientCsatReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientCsatReviewManager {
  return new LenientCsatReviewManager(
    store,
    defaultLenientCsatReviewValidator(),
    clockValue,
    [],
    defaultLenientCsatReviewEngine(flagsValue),
  );
}
