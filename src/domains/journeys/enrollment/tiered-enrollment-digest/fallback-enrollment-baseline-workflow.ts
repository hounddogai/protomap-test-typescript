import * as clock from "../../../../kit/clock.js";
import {
  FallbackEnrollmentBaselineEngine,
  defaultFallbackEnrollmentBaselineEngine,
} from "./fallback-enrollment-baseline-engine.js";
import {
  FallbackEnrollmentBaselineValidator,
  defaultFallbackEnrollmentBaselineValidator,
} from "./fallback-enrollment-baseline-rules.js";
import { FallbackEnrollmentBaselineStore } from "./fallback-enrollment-baseline-store.js";

/** Moves fallback enrollment baselines through their life cycle and keeps a journal of what it did. */
export class FallbackEnrollmentBaselineCoordinator {
  store: FallbackEnrollmentBaselineStore;
  validator: FallbackEnrollmentBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackEnrollmentBaselineEngine;

  constructor(
    store: FallbackEnrollmentBaselineStore,
    validator: FallbackEnrollmentBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackEnrollmentBaselineEngine,
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
      throw new Error(`fallback enrollment baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback enrollment baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback enrollment baseline ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackEnrollmentBaselineCoordinator(store: FallbackEnrollmentBaselineStore, clockValue: clock.Clock): FallbackEnrollmentBaselineCoordinator {
  return new FallbackEnrollmentBaselineCoordinator(
    store,
    defaultFallbackEnrollmentBaselineValidator(),
    clockValue,
    [],
    defaultFallbackEnrollmentBaselineEngine(),
  );
}
