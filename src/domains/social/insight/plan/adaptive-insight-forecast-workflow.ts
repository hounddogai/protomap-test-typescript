import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveInsightForecastEngine,
  defaultAdaptiveInsightForecastEngine,
} from "./adaptive-insight-forecast-engine.js";
import {
  AdaptiveInsightForecastValidator,
  defaultAdaptiveInsightForecastValidator,
} from "./adaptive-insight-forecast-rules.js";
import { AdaptiveInsightForecastStore } from "./adaptive-insight-forecast-store.js";

/** Moves adaptive insight forecasts through their life cycle and keeps a journal of what it did. */
export class AdaptiveInsightForecastDesk {
  store: AdaptiveInsightForecastStore;
  validator: AdaptiveInsightForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveInsightForecastEngine;

  constructor(
    store: AdaptiveInsightForecastStore,
    validator: AdaptiveInsightForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveInsightForecastEngine,
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
      throw new Error(`adaptive insight forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive insight forecast ${code} not found`);
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
      throw new Error(`adaptive insight forecast ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newAdaptiveInsightForecastDesk(store: AdaptiveInsightForecastStore, clockValue: clock.Clock): AdaptiveInsightForecastDesk {
  return new AdaptiveInsightForecastDesk(
    store,
    defaultAdaptiveInsightForecastValidator(),
    clockValue,
    [],
    defaultAdaptiveInsightForecastEngine(),
  );
}
