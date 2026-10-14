import * as clock from "../../../../kit/clock.js";
import { GlobalLeaderboardTierEngine, defaultGlobalLeaderboardTierEngine } from "./global-leaderboard-tier-engine.js";
import {
  GlobalLeaderboardTierValidator,
  defaultGlobalLeaderboardTierValidator,
} from "./global-leaderboard-tier-rules.js";
import { GlobalLeaderboardTierStore } from "./global-leaderboard-tier-store.js";

/** Moves global leaderboard tiers through their life cycle and keeps a journal of what it did. */
export class GlobalLeaderboardTierWorkflow {
  store: GlobalLeaderboardTierStore;
  validator: GlobalLeaderboardTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalLeaderboardTierEngine;

  constructor(
    store: GlobalLeaderboardTierStore,
    validator: GlobalLeaderboardTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalLeaderboardTierEngine,
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
      throw new Error(`global leaderboard tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global leaderboard tier ${code} not found`);
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
      throw new Error(`global leaderboard tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newGlobalLeaderboardTierWorkflow(store: GlobalLeaderboardTierStore, clockValue: clock.Clock): GlobalLeaderboardTierWorkflow {
  return new GlobalLeaderboardTierWorkflow(
    store,
    defaultGlobalLeaderboardTierValidator(),
    clockValue,
    [],
    defaultGlobalLeaderboardTierEngine(),
  );
}
