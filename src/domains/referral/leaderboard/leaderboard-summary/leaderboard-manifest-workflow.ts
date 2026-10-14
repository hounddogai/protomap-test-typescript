import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LeaderboardManifestEngine, defaultLeaderboardManifestEngine } from "./leaderboard-manifest-engine.js";
import { LeaderboardManifestValidator, defaultLeaderboardManifestValidator } from "./leaderboard-manifest-rules.js";
import { LeaderboardManifestStore } from "./leaderboard-manifest-store.js";

/** Moves leaderboard manifests through their life cycle and keeps a journal of what it did. */
export class LeaderboardManifestService {
  store: LeaderboardManifestStore;
  validator: LeaderboardManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardManifestEngine;

  constructor(
    store: LeaderboardManifestStore,
    validator: LeaderboardManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardManifestEngine,
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
      throw new Error(`leaderboard manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard manifest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLeaderboardManifestService(store: LeaderboardManifestStore, clockValue: clock.Clock, flagsValue: flags.Registry): LeaderboardManifestService {
  return new LeaderboardManifestService(
    store,
    defaultLeaderboardManifestValidator(),
    clockValue,
    [],
    defaultLeaderboardManifestEngine(flagsValue),
  );
}
