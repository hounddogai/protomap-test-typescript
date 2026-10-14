import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingJourneyBaselineEngine,
  defaultRollingJourneyBaselineEngine,
} from "./rolling-journey-baseline-engine.js";
import {
  RollingJourneyBaselineValidator,
  defaultRollingJourneyBaselineValidator,
} from "./rolling-journey-baseline-rules.js";
import { RollingJourneyBaselineStore } from "./rolling-journey-baseline-store.js";

/** Moves rolling journey baselines through their life cycle and keeps a journal of what it did. */
export class RollingJourneyBaselineDesk {
  store: RollingJourneyBaselineStore;
  validator: RollingJourneyBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingJourneyBaselineEngine;

  constructor(
    store: RollingJourneyBaselineStore,
    validator: RollingJourneyBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingJourneyBaselineEngine,
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
      throw new Error(`rolling journey baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling journey baseline ${code} not found`);
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
      throw new Error(`rolling journey baseline ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRollingJourneyBaselineDesk(store: RollingJourneyBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingJourneyBaselineDesk {
  return new RollingJourneyBaselineDesk(
    store,
    defaultRollingJourneyBaselineValidator(),
    clockValue,
    [],
    defaultRollingJourneyBaselineEngine(flagsValue),
  );
}
