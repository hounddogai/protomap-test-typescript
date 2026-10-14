import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingExitRuleReviewEngine,
  defaultRollingExitRuleReviewEngine,
} from "./rolling-exit-rule-review-engine.js";
import {
  RollingExitRuleReviewValidator,
  defaultRollingExitRuleReviewValidator,
} from "./rolling-exit-rule-review-rules.js";
import { RollingExitRuleReviewStore } from "./rolling-exit-rule-review-store.js";

/** Moves rolling exit rule reviews through their life cycle and keeps a journal of what it did. */
export class RollingExitRuleReviewManager {
  store: RollingExitRuleReviewStore;
  validator: RollingExitRuleReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingExitRuleReviewEngine;

  constructor(
    store: RollingExitRuleReviewStore,
    validator: RollingExitRuleReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingExitRuleReviewEngine,
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
      throw new Error(`rolling exit rule review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling exit rule review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling exit rule review ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingExitRuleReviewManager(store: RollingExitRuleReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingExitRuleReviewManager {
  return new RollingExitRuleReviewManager(
    store,
    defaultRollingExitRuleReviewValidator(),
    clockValue,
    [],
    defaultRollingExitRuleReviewEngine(flagsValue),
  );
}
