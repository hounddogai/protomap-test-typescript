import * as clock from "../../../../kit/clock.js";
import { StrictCohortProfileEngine, defaultStrictCohortProfileEngine } from "./strict-cohort-profile-engine.js";
import { StrictCohortProfileValidator, defaultStrictCohortProfileValidator } from "./strict-cohort-profile-rules.js";
import { StrictCohortProfileStore } from "./strict-cohort-profile-store.js";

/** Moves strict cohort profiles through their life cycle and keeps a journal of what it did. */
export class StrictCohortProfileWorkflow {
  store: StrictCohortProfileStore;
  validator: StrictCohortProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictCohortProfileEngine;

  constructor(
    store: StrictCohortProfileStore,
    validator: StrictCohortProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictCohortProfileEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict cohort profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict cohort profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict cohort profile ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newStrictCohortProfileWorkflow(store: StrictCohortProfileStore, clockValue: clock.Clock): StrictCohortProfileWorkflow {
  return new StrictCohortProfileWorkflow(
    store,
    defaultStrictCohortProfileValidator(),
    clockValue,
    [],
    defaultStrictCohortProfileEngine(),
  );
}
