import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalRetentionForecastEngine,
  defaultRegionalRetentionForecastEngine,
} from "./regional-retention-forecast-engine.js";
import {
  RegionalRetentionForecastValidator,
  defaultRegionalRetentionForecastValidator,
} from "./regional-retention-forecast-rules.js";
import { RegionalRetentionForecastStore } from "./regional-retention-forecast-store.js";

/** Moves regional retention forecasts through their life cycle and keeps a journal of what it did. */
export class RegionalRetentionForecastDesk {
  store: RegionalRetentionForecastStore;
  validator: RegionalRetentionForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalRetentionForecastEngine;

  constructor(
    store: RegionalRetentionForecastStore,
    validator: RegionalRetentionForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalRetentionForecastEngine,
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
      throw new Error(`regional retention forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional retention forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional retention forecast ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalRetentionForecastDesk(store: RegionalRetentionForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalRetentionForecastDesk {
  return new RegionalRetentionForecastDesk(
    store,
    defaultRegionalRetentionForecastValidator(),
    clockValue,
    [],
    defaultRegionalRetentionForecastEngine(flagsValue),
  );
}
