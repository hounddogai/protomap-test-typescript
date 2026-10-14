import * as clock from "../../../../kit/clock.js";
import { EnrollmentBundleEngine, defaultEnrollmentBundleEngine } from "./enrollment-bundle-engine.js";
import { EnrollmentBundleValidator, defaultEnrollmentBundleValidator } from "./enrollment-bundle-rules.js";
import { EnrollmentBundleStore } from "./enrollment-bundle-store.js";

/** Moves enrollment bundles through their life cycle and keeps a journal of what it did. */
export class EnrollmentBundleManager {
  store: EnrollmentBundleStore;
  validator: EnrollmentBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentBundleEngine;

  constructor(
    store: EnrollmentBundleStore,
    validator: EnrollmentBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentBundleEngine,
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
      throw new Error(`enrollment bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEnrollmentBundleManager(store: EnrollmentBundleStore, clockValue: clock.Clock): EnrollmentBundleManager {
  return new EnrollmentBundleManager(
    store,
    defaultEnrollmentBundleValidator(),
    clockValue,
    [],
    defaultEnrollmentBundleEngine(),
  );
}
