import * as clock from "../../../../kit/clock.js";
import { LeaderboardAuditEngine, defaultLeaderboardAuditEngine } from "./leaderboard-audit-engine.js";
import { LeaderboardAuditValidator, defaultLeaderboardAuditValidator } from "./leaderboard-audit-rules.js";
import { LeaderboardAuditStore } from "./leaderboard-audit-store.js";

/** Moves leaderboard audits through their life cycle and keeps a journal of what it did. */
export class LeaderboardAuditService {
  store: LeaderboardAuditStore;
  validator: LeaderboardAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardAuditEngine;

  constructor(
    store: LeaderboardAuditStore,
    validator: LeaderboardAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardAuditEngine,
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
      throw new Error(`leaderboard audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard audit ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLeaderboardAuditService(store: LeaderboardAuditStore, clockValue: clock.Clock): LeaderboardAuditService {
  return new LeaderboardAuditService(
    store,
    defaultLeaderboardAuditValidator(),
    clockValue,
    [],
    defaultLeaderboardAuditEngine(),
  );
}
