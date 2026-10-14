import * as clock from "../../../../kit/clock.js";
import {
  FallbackStreakForecastEngine,
  defaultFallbackStreakForecastEngine,
} from "./fallback-streak-forecast-engine.js";
import {
  FallbackStreakForecastValidator,
  defaultFallbackStreakForecastValidator,
} from "./fallback-streak-forecast-rules.js";
import { FallbackStreakForecastStore } from "./fallback-streak-forecast-store.js";

/** Moves fallback streak forecasts through their life cycle and keeps a journal of what it did. */
export class FallbackStreakForecastCoordinator {
  store: FallbackStreakForecastStore;
  validator: FallbackStreakForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackStreakForecastEngine;

  constructor(
    store: FallbackStreakForecastStore,
    validator: FallbackStreakForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackStreakForecastEngine,
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
      throw new Error(`fallback streak forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback streak forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback streak forecast ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackStreakForecastCoordinator(store: FallbackStreakForecastStore, clockValue: clock.Clock): FallbackStreakForecastCoordinator {
  return new FallbackStreakForecastCoordinator(
    store,
    defaultFallbackStreakForecastValidator(),
    clockValue,
    [],
    defaultFallbackStreakForecastEngine(),
  );
}
