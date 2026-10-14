import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedRewardForecastEngine,
  defaultWeightedRewardForecastEngine,
} from "./weighted-reward-forecast-engine.js";
import {
  WeightedRewardForecastValidator,
  defaultWeightedRewardForecastValidator,
} from "./weighted-reward-forecast-rules.js";
import { WeightedRewardForecastStore } from "./weighted-reward-forecast-store.js";

/** Moves weighted reward forecasts through their life cycle and keeps a journal of what it did. */
export class WeightedRewardForecastWorkflow {
  store: WeightedRewardForecastStore;
  validator: WeightedRewardForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedRewardForecastEngine;

  constructor(
    store: WeightedRewardForecastStore,
    validator: WeightedRewardForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedRewardForecastEngine,
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
      throw new Error(`weighted reward forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward forecast ${code} not found`);
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
      throw new Error(`weighted reward forecast ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWeightedRewardForecastWorkflow(store: WeightedRewardForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedRewardForecastWorkflow {
  return new WeightedRewardForecastWorkflow(
    store,
    defaultWeightedRewardForecastValidator(),
    clockValue,
    [],
    defaultWeightedRewardForecastEngine(flagsValue),
  );
}
