import * as clock from "../../../../kit/clock.js";
import { GlobalPacingReviewEngine, defaultGlobalPacingReviewEngine } from "./global-pacing-review-engine.js";
import { GlobalPacingReviewValidator, defaultGlobalPacingReviewValidator } from "./global-pacing-review-rules.js";
import { GlobalPacingReviewStore } from "./global-pacing-review-store.js";

/** Moves global pacing reviews through their life cycle and keeps a journal of what it did. */
export class GlobalPacingReviewService {
  store: GlobalPacingReviewStore;
  validator: GlobalPacingReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalPacingReviewEngine;

  constructor(
    store: GlobalPacingReviewStore,
    validator: GlobalPacingReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalPacingReviewEngine,
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
      throw new Error(`global pacing review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global pacing review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global pacing review ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalPacingReviewService(store: GlobalPacingReviewStore, clockValue: clock.Clock): GlobalPacingReviewService {
  return new GlobalPacingReviewService(
    store,
    defaultGlobalPacingReviewValidator(),
    clockValue,
    [],
    defaultGlobalPacingReviewEngine(),
  );
}
