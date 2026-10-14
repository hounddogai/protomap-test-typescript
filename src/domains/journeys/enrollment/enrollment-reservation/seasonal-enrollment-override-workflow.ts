import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalEnrollmentOverrideEngine,
  defaultSeasonalEnrollmentOverrideEngine,
} from "./seasonal-enrollment-override-engine.js";
import {
  SeasonalEnrollmentOverrideValidator,
  defaultSeasonalEnrollmentOverrideValidator,
} from "./seasonal-enrollment-override-rules.js";
import { SeasonalEnrollmentOverrideStore } from "./seasonal-enrollment-override-store.js";

/** Moves seasonal enrollment overrides through their life cycle and keeps a journal of what it did. */
export class SeasonalEnrollmentOverrideWorkflow {
  store: SeasonalEnrollmentOverrideStore;
  validator: SeasonalEnrollmentOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalEnrollmentOverrideEngine;

  constructor(
    store: SeasonalEnrollmentOverrideStore,
    validator: SeasonalEnrollmentOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalEnrollmentOverrideEngine,
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
      throw new Error(`seasonal enrollment override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal enrollment override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal enrollment override ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newSeasonalEnrollmentOverrideWorkflow(store: SeasonalEnrollmentOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalEnrollmentOverrideWorkflow {
  return new SeasonalEnrollmentOverrideWorkflow(
    store,
    defaultSeasonalEnrollmentOverrideValidator(),
    clockValue,
    [],
    defaultSeasonalEnrollmentOverrideEngine(flagsValue),
  );
}
