import * as clock from "../../../../kit/clock.js";
import { AdaptiveModelForecastEngine, defaultAdaptiveModelForecastEngine } from "./adaptive-model-forecast-engine.js";
import {
  AdaptiveModelForecastValidator,
  defaultAdaptiveModelForecastValidator,
} from "./adaptive-model-forecast-rules.js";
import { AdaptiveModelForecastStore } from "./adaptive-model-forecast-store.js";

/** Moves adaptive model forecasts through their life cycle and keeps a journal of what it did. */
export class AdaptiveModelForecastCoordinator {
  store: AdaptiveModelForecastStore;
  validator: AdaptiveModelForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveModelForecastEngine;

  constructor(
    store: AdaptiveModelForecastStore,
    validator: AdaptiveModelForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveModelForecastEngine,
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
      throw new Error(`adaptive model forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive model forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive model forecast ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newAdaptiveModelForecastCoordinator(store: AdaptiveModelForecastStore, clockValue: clock.Clock): AdaptiveModelForecastCoordinator {
  return new AdaptiveModelForecastCoordinator(
    store,
    defaultAdaptiveModelForecastValidator(),
    clockValue,
    [],
    defaultAdaptiveModelForecastEngine(),
  );
}
