import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptivePreferenceReviewEngine,
  defaultAdaptivePreferenceReviewEngine,
} from "./adaptive-preference-review-engine.js";
import {
  AdaptivePreferenceReviewValidator,
  defaultAdaptivePreferenceReviewValidator,
} from "./adaptive-preference-review-rules.js";
import { AdaptivePreferenceReviewStore } from "./adaptive-preference-review-store.js";

/** Moves adaptive preference reviews through their life cycle and keeps a journal of what it did. */
export class AdaptivePreferenceReviewDesk {
  store: AdaptivePreferenceReviewStore;
  validator: AdaptivePreferenceReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePreferenceReviewEngine;

  constructor(
    store: AdaptivePreferenceReviewStore,
    validator: AdaptivePreferenceReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePreferenceReviewEngine,
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
      throw new Error(`adaptive preference review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive preference review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive preference review ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newAdaptivePreferenceReviewDesk(store: AdaptivePreferenceReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptivePreferenceReviewDesk {
  return new AdaptivePreferenceReviewDesk(
    store,
    defaultAdaptivePreferenceReviewValidator(),
    clockValue,
    [],
    defaultAdaptivePreferenceReviewEngine(flagsValue),
  );
}
