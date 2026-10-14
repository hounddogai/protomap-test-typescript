import * as clock from "../../../../kit/clock.js";
import {
  TieredRetentionForecastEngine,
  defaultTieredRetentionForecastEngine,
} from "./tiered-retention-forecast-engine.js";
import {
  TieredRetentionForecastValidator,
  defaultTieredRetentionForecastValidator,
} from "./tiered-retention-forecast-rules.js";
import { TieredRetentionForecastStore } from "./tiered-retention-forecast-store.js";

/** Moves tiered retention forecasts through their life cycle and keeps a journal of what it did. */
export class TieredRetentionForecastWorkflow {
  store: TieredRetentionForecastStore;
  validator: TieredRetentionForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredRetentionForecastEngine;

  constructor(
    store: TieredRetentionForecastStore,
    validator: TieredRetentionForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredRetentionForecastEngine,
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
      throw new Error(`tiered retention forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered retention forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered retention forecast ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newTieredRetentionForecastWorkflow(store: TieredRetentionForecastStore, clockValue: clock.Clock): TieredRetentionForecastWorkflow {
  return new TieredRetentionForecastWorkflow(
    store,
    defaultTieredRetentionForecastValidator(),
    clockValue,
    [],
    defaultTieredRetentionForecastEngine(),
  );
}
