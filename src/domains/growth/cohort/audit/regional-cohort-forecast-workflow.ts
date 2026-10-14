import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalCohortForecastEngine,
  defaultRegionalCohortForecastEngine,
} from "./regional-cohort-forecast-engine.js";
import {
  RegionalCohortForecastValidator,
  defaultRegionalCohortForecastValidator,
} from "./regional-cohort-forecast-rules.js";
import { RegionalCohortForecastStore } from "./regional-cohort-forecast-store.js";

/** Moves regional cohort forecasts through their life cycle and keeps a journal of what it did. */
export class RegionalCohortForecastDesk {
  store: RegionalCohortForecastStore;
  validator: RegionalCohortForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalCohortForecastEngine;

  constructor(
    store: RegionalCohortForecastStore,
    validator: RegionalCohortForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalCohortForecastEngine,
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
      throw new Error(`regional cohort forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional cohort forecast ${code} not found`);
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
      throw new Error(`regional cohort forecast ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newRegionalCohortForecastDesk(store: RegionalCohortForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalCohortForecastDesk {
  return new RegionalCohortForecastDesk(
    store,
    defaultRegionalCohortForecastValidator(),
    clockValue,
    [],
    defaultRegionalCohortForecastEngine(flagsValue),
  );
}
