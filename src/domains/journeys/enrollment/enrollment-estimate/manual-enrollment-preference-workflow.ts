import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualEnrollmentPreferenceEngine,
  defaultManualEnrollmentPreferenceEngine,
} from "./manual-enrollment-preference-engine.js";
import {
  ManualEnrollmentPreferenceValidator,
  defaultManualEnrollmentPreferenceValidator,
} from "./manual-enrollment-preference-rules.js";
import { ManualEnrollmentPreferenceStore } from "./manual-enrollment-preference-store.js";

/** Moves manual enrollment preferences through their life cycle and keeps a journal of what it did. */
export class ManualEnrollmentPreferenceCoordinator {
  store: ManualEnrollmentPreferenceStore;
  validator: ManualEnrollmentPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualEnrollmentPreferenceEngine;

  constructor(
    store: ManualEnrollmentPreferenceStore,
    validator: ManualEnrollmentPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualEnrollmentPreferenceEngine,
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
      throw new Error(`manual enrollment preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual enrollment preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual enrollment preference ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newManualEnrollmentPreferenceCoordinator(store: ManualEnrollmentPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualEnrollmentPreferenceCoordinator {
  return new ManualEnrollmentPreferenceCoordinator(
    store,
    defaultManualEnrollmentPreferenceValidator(),
    clockValue,
    [],
    defaultManualEnrollmentPreferenceEngine(flagsValue),
  );
}
