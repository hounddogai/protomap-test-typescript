import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveEnrollmentGroupEngine,
  defaultAdaptiveEnrollmentGroupEngine,
} from "./adaptive-enrollment-group-engine.js";
import {
  AdaptiveEnrollmentGroupValidator,
  defaultAdaptiveEnrollmentGroupValidator,
} from "./adaptive-enrollment-group-rules.js";
import { AdaptiveEnrollmentGroupStore } from "./adaptive-enrollment-group-store.js";

/** Moves adaptive enrollment groups through their life cycle and keeps a journal of what it did. */
export class AdaptiveEnrollmentGroupCoordinator {
  store: AdaptiveEnrollmentGroupStore;
  validator: AdaptiveEnrollmentGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveEnrollmentGroupEngine;

  constructor(
    store: AdaptiveEnrollmentGroupStore,
    validator: AdaptiveEnrollmentGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveEnrollmentGroupEngine,
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
      throw new Error(`adaptive enrollment group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive enrollment group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive enrollment group ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveEnrollmentGroupCoordinator(store: AdaptiveEnrollmentGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveEnrollmentGroupCoordinator {
  return new AdaptiveEnrollmentGroupCoordinator(
    store,
    defaultAdaptiveEnrollmentGroupValidator(),
    clockValue,
    [],
    defaultAdaptiveEnrollmentGroupEngine(flagsValue),
  );
}
