import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ModelForecastEngine, defaultModelForecastEngine } from "./model-forecast-engine.js";
import { ModelForecastValidator, defaultModelForecastValidator } from "./model-forecast-rules.js";
import { ModelForecastStore } from "./model-forecast-store.js";

/** Moves model forecasts through their life cycle and keeps a journal of what it did. */
export class ModelForecastDesk {
  store: ModelForecastStore;
  validator: ModelForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelForecastEngine;

  constructor(
    store: ModelForecastStore,
    validator: ModelForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelForecastEngine,
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
      throw new Error(`model forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model forecast ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newModelForecastDesk(store: ModelForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): ModelForecastDesk {
  return new ModelForecastDesk(
    store,
    defaultModelForecastValidator(),
    clockValue,
    [],
    defaultModelForecastEngine(flagsValue),
  );
}
