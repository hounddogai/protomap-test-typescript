import * as clock from "../../../../kit/clock.js";
import { LeaderboardReviewEngine, defaultLeaderboardReviewEngine } from "./leaderboard-review-engine.js";
import { LeaderboardReviewValidator, defaultLeaderboardReviewValidator } from "./leaderboard-review-rules.js";
import { LeaderboardReviewStore } from "./leaderboard-review-store.js";

/** Moves leaderboard reviews through their life cycle and keeps a journal of what it did. */
export class LeaderboardReviewService {
  store: LeaderboardReviewStore;
  validator: LeaderboardReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardReviewEngine;

  constructor(
    store: LeaderboardReviewStore,
    validator: LeaderboardReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardReviewEngine,
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
      throw new Error(`leaderboard review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard review ${code} not found`);
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
      throw new Error(`leaderboard review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLeaderboardReviewService(store: LeaderboardReviewStore, clockValue: clock.Clock): LeaderboardReviewService {
  return new LeaderboardReviewService(
    store,
    defaultLeaderboardReviewValidator(),
    clockValue,
    [],
    defaultLeaderboardReviewEngine(),
  );
}
