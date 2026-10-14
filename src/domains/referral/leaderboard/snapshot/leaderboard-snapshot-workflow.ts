import * as clock from "../../../../kit/clock.js";
import { LeaderboardSnapshotEngine, defaultLeaderboardSnapshotEngine } from "./leaderboard-snapshot-engine.js";
import { LeaderboardSnapshotValidator, defaultLeaderboardSnapshotValidator } from "./leaderboard-snapshot-rules.js";
import { LeaderboardSnapshotStore } from "./leaderboard-snapshot-store.js";

/** Moves leaderboard snapshots through their life cycle and keeps a journal of what it did. */
export class LeaderboardSnapshotManager {
  store: LeaderboardSnapshotStore;
  validator: LeaderboardSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardSnapshotEngine;

  constructor(
    store: LeaderboardSnapshotStore,
    validator: LeaderboardSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardSnapshotEngine,
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
      throw new Error(`leaderboard snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard snapshot ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLeaderboardSnapshotManager(store: LeaderboardSnapshotStore, clockValue: clock.Clock): LeaderboardSnapshotManager {
  return new LeaderboardSnapshotManager(
    store,
    defaultLeaderboardSnapshotValidator(),
    clockValue,
    [],
    defaultLeaderboardSnapshotEngine(),
  );
}
