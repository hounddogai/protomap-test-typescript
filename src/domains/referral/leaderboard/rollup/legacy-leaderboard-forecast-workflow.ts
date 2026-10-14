import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyLeaderboardForecastEngine,
  defaultLegacyLeaderboardForecastEngine,
} from "./legacy-leaderboard-forecast-engine.js";
import {
  LegacyLeaderboardForecastValidator,
  defaultLegacyLeaderboardForecastValidator,
} from "./legacy-leaderboard-forecast-rules.js";
import { LegacyLeaderboardForecastStore } from "./legacy-leaderboard-forecast-store.js";

/** Moves legacy leaderboard forecasts through their life cycle and keeps a journal of what it did. */
export class LegacyLeaderboardForecastDesk {
  store: LegacyLeaderboardForecastStore;
  validator: LegacyLeaderboardForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyLeaderboardForecastEngine;

  constructor(
    store: LegacyLeaderboardForecastStore,
    validator: LegacyLeaderboardForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyLeaderboardForecastEngine,
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
      throw new Error(`legacy leaderboard forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy leaderboard forecast ${code} not found`);
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
      throw new Error(`legacy leaderboard forecast ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLegacyLeaderboardForecastDesk(store: LegacyLeaderboardForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyLeaderboardForecastDesk {
  return new LegacyLeaderboardForecastDesk(
    store,
    defaultLegacyLeaderboardForecastValidator(),
    clockValue,
    [],
    defaultLegacyLeaderboardForecastEngine(flagsValue),
  );
}
