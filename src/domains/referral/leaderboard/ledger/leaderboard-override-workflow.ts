import * as clock from "../../../../kit/clock.js";
import { LeaderboardOverrideEngine, defaultLeaderboardOverrideEngine } from "./leaderboard-override-engine.js";
import { LeaderboardOverrideValidator, defaultLeaderboardOverrideValidator } from "./leaderboard-override-rules.js";
import { LeaderboardOverrideStore } from "./leaderboard-override-store.js";

/** Moves leaderboard overrides through their life cycle and keeps a journal of what it did. */
export class LeaderboardOverrideDesk {
  store: LeaderboardOverrideStore;
  validator: LeaderboardOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardOverrideEngine;

  constructor(
    store: LeaderboardOverrideStore,
    validator: LeaderboardOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardOverrideEngine,
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
      throw new Error(`leaderboard override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard override ${code} not found`);
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

export function newLeaderboardOverrideDesk(store: LeaderboardOverrideStore, clockValue: clock.Clock): LeaderboardOverrideDesk {
  return new LeaderboardOverrideDesk(
    store,
    defaultLeaderboardOverrideValidator(),
    clockValue,
    [],
    defaultLeaderboardOverrideEngine(),
  );
}
