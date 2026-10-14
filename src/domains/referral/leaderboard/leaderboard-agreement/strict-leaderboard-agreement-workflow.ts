import * as clock from "../../../../kit/clock.js";
import {
  StrictLeaderboardAgreementEngine,
  defaultStrictLeaderboardAgreementEngine,
} from "./strict-leaderboard-agreement-engine.js";
import {
  StrictLeaderboardAgreementValidator,
  defaultStrictLeaderboardAgreementValidator,
} from "./strict-leaderboard-agreement-rules.js";
import { StrictLeaderboardAgreementStore } from "./strict-leaderboard-agreement-store.js";

/** Moves strict leaderboard agreements through their life cycle and keeps a journal of what it did. */
export class StrictLeaderboardAgreementCoordinator {
  store: StrictLeaderboardAgreementStore;
  validator: StrictLeaderboardAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictLeaderboardAgreementEngine;

  constructor(
    store: StrictLeaderboardAgreementStore,
    validator: StrictLeaderboardAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictLeaderboardAgreementEngine,
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
      throw new Error(`strict leaderboard agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict leaderboard agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict leaderboard agreement ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictLeaderboardAgreementCoordinator(store: StrictLeaderboardAgreementStore, clockValue: clock.Clock): StrictLeaderboardAgreementCoordinator {
  return new StrictLeaderboardAgreementCoordinator(
    store,
    defaultStrictLeaderboardAgreementValidator(),
    clockValue,
    [],
    defaultStrictLeaderboardAgreementEngine(),
  );
}
