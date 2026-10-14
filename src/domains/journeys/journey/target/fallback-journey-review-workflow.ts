import * as clock from "../../../../kit/clock.js";
import { FallbackJourneyReviewEngine, defaultFallbackJourneyReviewEngine } from "./fallback-journey-review-engine.js";
import {
  FallbackJourneyReviewValidator,
  defaultFallbackJourneyReviewValidator,
} from "./fallback-journey-review-rules.js";
import { FallbackJourneyReviewStore } from "./fallback-journey-review-store.js";

/** Moves fallback journey reviews through their life cycle and keeps a journal of what it did. */
export class FallbackJourneyReviewWorkflow {
  store: FallbackJourneyReviewStore;
  validator: FallbackJourneyReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackJourneyReviewEngine;

  constructor(
    store: FallbackJourneyReviewStore,
    validator: FallbackJourneyReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackJourneyReviewEngine,
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
      throw new Error(`fallback journey review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback journey review ${code} not found`);
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
      throw new Error(`fallback journey review ${code} not found`);
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

export function newFallbackJourneyReviewWorkflow(store: FallbackJourneyReviewStore, clockValue: clock.Clock): FallbackJourneyReviewWorkflow {
  return new FallbackJourneyReviewWorkflow(
    store,
    defaultFallbackJourneyReviewValidator(),
    clockValue,
    [],
    defaultFallbackJourneyReviewEngine(),
  );
}
