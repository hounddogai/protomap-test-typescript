import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PlacementForecastEngine, defaultPlacementForecastEngine } from "./placement-forecast-engine.js";
import { PlacementForecastValidator, defaultPlacementForecastValidator } from "./placement-forecast-rules.js";
import { PlacementForecastStore } from "./placement-forecast-store.js";

/** Moves placement forecasts through their life cycle and keeps a journal of what it did. */
export class PlacementForecastCoordinator {
  store: PlacementForecastStore;
  validator: PlacementForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementForecastEngine;

  constructor(
    store: PlacementForecastStore,
    validator: PlacementForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementForecastEngine,
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
      throw new Error(`placement forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement forecast ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPlacementForecastCoordinator(store: PlacementForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): PlacementForecastCoordinator {
  return new PlacementForecastCoordinator(
    store,
    defaultPlacementForecastValidator(),
    clockValue,
    [],
    defaultPlacementForecastEngine(flagsValue),
  );
}
