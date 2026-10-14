import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryBounceReviewEngine, defaultPrimaryBounceReviewEngine } from "./primary-bounce-review-engine.js";
import { PrimaryBounceReviewValidator, defaultPrimaryBounceReviewValidator } from "./primary-bounce-review-rules.js";
import { PrimaryBounceReviewStore } from "./primary-bounce-review-store.js";

/** Moves primary bounce reviews through their life cycle and keeps a journal of what it did. */
export class PrimaryBounceReviewCoordinator {
  store: PrimaryBounceReviewStore;
  validator: PrimaryBounceReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryBounceReviewEngine;

  constructor(
    store: PrimaryBounceReviewStore,
    validator: PrimaryBounceReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryBounceReviewEngine,
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
      throw new Error(`primary bounce review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary bounce review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary bounce review ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPrimaryBounceReviewCoordinator(store: PrimaryBounceReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryBounceReviewCoordinator {
  return new PrimaryBounceReviewCoordinator(
    store,
    defaultPrimaryBounceReviewValidator(),
    clockValue,
    [],
    defaultPrimaryBounceReviewEngine(flagsValue),
  );
}
