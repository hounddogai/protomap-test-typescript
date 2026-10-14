import * as clock from "../../../../kit/clock.js";
import {
  RollingSuppressionForecastEngine,
  defaultRollingSuppressionForecastEngine,
} from "./rolling-suppression-forecast-engine.js";
import {
  RollingSuppressionForecastValidator,
  defaultRollingSuppressionForecastValidator,
} from "./rolling-suppression-forecast-rules.js";
import { RollingSuppressionForecastStore } from "./rolling-suppression-forecast-store.js";

/** Moves rolling suppression forecasts through their life cycle and keeps a journal of what it did. */
export class RollingSuppressionForecastDesk {
  store: RollingSuppressionForecastStore;
  validator: RollingSuppressionForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingSuppressionForecastEngine;

  constructor(
    store: RollingSuppressionForecastStore,
    validator: RollingSuppressionForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingSuppressionForecastEngine,
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
      throw new Error(`rolling suppression forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling suppression forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling suppression forecast ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingSuppressionForecastDesk(store: RollingSuppressionForecastStore, clockValue: clock.Clock): RollingSuppressionForecastDesk {
  return new RollingSuppressionForecastDesk(
    store,
    defaultRollingSuppressionForecastValidator(),
    clockValue,
    [],
    defaultRollingSuppressionForecastEngine(),
  );
}
