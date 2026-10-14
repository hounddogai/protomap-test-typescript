import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalLeaderboardAgreementEngine,
  defaultSeasonalLeaderboardAgreementEngine,
} from "./seasonal-leaderboard-agreement-engine.js";
import {
  SeasonalLeaderboardAgreementValidator,
  defaultSeasonalLeaderboardAgreementValidator,
} from "./seasonal-leaderboard-agreement-rules.js";
import { SeasonalLeaderboardAgreementStore } from "./seasonal-leaderboard-agreement-store.js";

/** Moves seasonal leaderboard agreements through their life cycle and keeps a journal of what it did. */
export class SeasonalLeaderboardAgreementService {
  store: SeasonalLeaderboardAgreementStore;
  validator: SeasonalLeaderboardAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalLeaderboardAgreementEngine;

  constructor(
    store: SeasonalLeaderboardAgreementStore,
    validator: SeasonalLeaderboardAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalLeaderboardAgreementEngine,
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
      throw new Error(`seasonal leaderboard agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal leaderboard agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal leaderboard agreement ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalLeaderboardAgreementService(store: SeasonalLeaderboardAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalLeaderboardAgreementService {
  return new SeasonalLeaderboardAgreementService(
    store,
    defaultSeasonalLeaderboardAgreementValidator(),
    clockValue,
    [],
    defaultSeasonalLeaderboardAgreementEngine(flagsValue),
  );
}
