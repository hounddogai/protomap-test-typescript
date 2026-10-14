import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalBranchReviewEngine, defaultGlobalBranchReviewEngine } from "./global-branch-review-engine.js";
import { GlobalBranchReviewValidator, defaultGlobalBranchReviewValidator } from "./global-branch-review-rules.js";
import { GlobalBranchReviewStore } from "./global-branch-review-store.js";

/** Moves global branch reviews through their life cycle and keeps a journal of what it did. */
export class GlobalBranchReviewService {
  store: GlobalBranchReviewStore;
  validator: GlobalBranchReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalBranchReviewEngine;

  constructor(
    store: GlobalBranchReviewStore,
    validator: GlobalBranchReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalBranchReviewEngine,
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
      throw new Error(`global branch review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global branch review ${code} not found`);
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
      throw new Error(`global branch review ${code} not found`);
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

export function newGlobalBranchReviewService(store: GlobalBranchReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalBranchReviewService {
  return new GlobalBranchReviewService(
    store,
    defaultGlobalBranchReviewValidator(),
    clockValue,
    [],
    defaultGlobalBranchReviewEngine(flagsValue),
  );
}
