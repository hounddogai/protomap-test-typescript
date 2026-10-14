import * as clock from "../../../../kit/clock.js";
import { LegacyInsightForecastEngine, defaultLegacyInsightForecastEngine } from "./legacy-insight-forecast-engine.js";
import {
  LegacyInsightForecastValidator,
  defaultLegacyInsightForecastValidator,
} from "./legacy-insight-forecast-rules.js";
import { LegacyInsightForecastStore } from "./legacy-insight-forecast-store.js";

/** Moves legacy insight forecasts through their life cycle and keeps a journal of what it did. */
export class LegacyInsightForecastManager {
  store: LegacyInsightForecastStore;
  validator: LegacyInsightForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyInsightForecastEngine;

  constructor(
    store: LegacyInsightForecastStore,
    validator: LegacyInsightForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyInsightForecastEngine,
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
      throw new Error(`legacy insight forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy insight forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy insight forecast ${code} not found`);
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

export function newLegacyInsightForecastManager(store: LegacyInsightForecastStore, clockValue: clock.Clock): LegacyInsightForecastManager {
  return new LegacyInsightForecastManager(
    store,
    defaultLegacyInsightForecastValidator(),
    clockValue,
    [],
    defaultLegacyInsightForecastEngine(),
  );
}
