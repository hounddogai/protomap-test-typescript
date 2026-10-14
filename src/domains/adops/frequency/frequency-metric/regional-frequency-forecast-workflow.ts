import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalFrequencyForecastEngine,
  defaultRegionalFrequencyForecastEngine,
} from "./regional-frequency-forecast-engine.js";
import {
  RegionalFrequencyForecastValidator,
  defaultRegionalFrequencyForecastValidator,
} from "./regional-frequency-forecast-rules.js";
import { RegionalFrequencyForecastStore } from "./regional-frequency-forecast-store.js";

/** Moves regional frequency forecasts through their life cycle and keeps a journal of what it did. */
export class RegionalFrequencyForecastWorkflow {
  store: RegionalFrequencyForecastStore;
  validator: RegionalFrequencyForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalFrequencyForecastEngine;

  constructor(
    store: RegionalFrequencyForecastStore,
    validator: RegionalFrequencyForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalFrequencyForecastEngine,
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
      throw new Error(`regional frequency forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional frequency forecast ${code} not found`);
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
      throw new Error(`regional frequency forecast ${code} not found`);
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

export function newRegionalFrequencyForecastWorkflow(store: RegionalFrequencyForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalFrequencyForecastWorkflow {
  return new RegionalFrequencyForecastWorkflow(
    store,
    defaultRegionalFrequencyForecastValidator(),
    clockValue,
    [],
    defaultRegionalFrequencyForecastEngine(flagsValue),
  );
}
