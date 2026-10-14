import * as clock from "../../../../kit/clock.js";
import { RollingNudgeReviewEngine, defaultRollingNudgeReviewEngine } from "./rolling-nudge-review-engine.js";
import { RollingNudgeReviewValidator, defaultRollingNudgeReviewValidator } from "./rolling-nudge-review-rules.js";
import { RollingNudgeReviewStore } from "./rolling-nudge-review-store.js";

/** Moves rolling nudge reviews through their life cycle and keeps a journal of what it did. */
export class RollingNudgeReviewWorkflow {
  store: RollingNudgeReviewStore;
  validator: RollingNudgeReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingNudgeReviewEngine;

  constructor(
    store: RollingNudgeReviewStore,
    validator: RollingNudgeReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingNudgeReviewEngine,
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
      throw new Error(`rolling nudge review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling nudge review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling nudge review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newRollingNudgeReviewWorkflow(store: RollingNudgeReviewStore, clockValue: clock.Clock): RollingNudgeReviewWorkflow {
  return new RollingNudgeReviewWorkflow(
    store,
    defaultRollingNudgeReviewValidator(),
    clockValue,
    [],
    defaultRollingNudgeReviewEngine(),
  );
}
