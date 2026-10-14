import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredTierForecastEngine, defaultTieredTierForecastEngine } from "./tiered-tier-forecast-engine.js";
import { TieredTierForecastValidator, defaultTieredTierForecastValidator } from "./tiered-tier-forecast-rules.js";
import { TieredTierForecastStore } from "./tiered-tier-forecast-store.js";

/** Moves tiered tier forecasts through their life cycle and keeps a journal of what it did. */
export class TieredTierForecastDesk {
  store: TieredTierForecastStore;
  validator: TieredTierForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTierForecastEngine;

  constructor(
    store: TieredTierForecastStore,
    validator: TieredTierForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTierForecastEngine,
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
      throw new Error(`tiered tier forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered tier forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered tier forecast ${code} not found`);
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

export function newTieredTierForecastDesk(store: TieredTierForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredTierForecastDesk {
  return new TieredTierForecastDesk(
    store,
    defaultTieredTierForecastValidator(),
    clockValue,
    [],
    defaultTieredTierForecastEngine(flagsValue),
  );
}
