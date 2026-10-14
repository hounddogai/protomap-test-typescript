import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveEnrollmentPlanEngine,
  defaultAdaptiveEnrollmentPlanEngine,
} from "./adaptive-enrollment-plan-engine.js";
import {
  AdaptiveEnrollmentPlanValidator,
  defaultAdaptiveEnrollmentPlanValidator,
} from "./adaptive-enrollment-plan-rules.js";
import { AdaptiveEnrollmentPlanStore } from "./adaptive-enrollment-plan-store.js";

/** Moves adaptive enrollment plans through their life cycle and keeps a journal of what it did. */
export class AdaptiveEnrollmentPlanDesk {
  store: AdaptiveEnrollmentPlanStore;
  validator: AdaptiveEnrollmentPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveEnrollmentPlanEngine;

  constructor(
    store: AdaptiveEnrollmentPlanStore,
    validator: AdaptiveEnrollmentPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveEnrollmentPlanEngine,
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
      throw new Error(`adaptive enrollment plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive enrollment plan ${code} not found`);
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
      throw new Error(`adaptive enrollment plan ${code} not found`);
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

export function newAdaptiveEnrollmentPlanDesk(store: AdaptiveEnrollmentPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveEnrollmentPlanDesk {
  return new AdaptiveEnrollmentPlanDesk(
    store,
    defaultAdaptiveEnrollmentPlanValidator(),
    clockValue,
    [],
    defaultAdaptiveEnrollmentPlanEngine(flagsValue),
  );
}
