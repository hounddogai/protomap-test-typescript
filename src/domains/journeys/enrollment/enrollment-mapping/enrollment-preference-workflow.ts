import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EnrollmentPreferenceEngine, defaultEnrollmentPreferenceEngine } from "./enrollment-preference-engine.js";
import {
  EnrollmentPreferenceValidator,
  defaultEnrollmentPreferenceValidator,
} from "./enrollment-preference-rules.js";
import { EnrollmentPreferenceStore } from "./enrollment-preference-store.js";

/** Moves enrollment preferences through their life cycle and keeps a journal of what it did. */
export class EnrollmentPreferenceCoordinator {
  store: EnrollmentPreferenceStore;
  validator: EnrollmentPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentPreferenceEngine;

  constructor(
    store: EnrollmentPreferenceStore,
    validator: EnrollmentPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentPreferenceEngine,
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
      throw new Error(`enrollment preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment preference ${code} not found`);
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

export function newEnrollmentPreferenceCoordinator(store: EnrollmentPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): EnrollmentPreferenceCoordinator {
  return new EnrollmentPreferenceCoordinator(
    store,
    defaultEnrollmentPreferenceValidator(),
    clockValue,
    [],
    defaultEnrollmentPreferenceEngine(flagsValue),
  );
}
