import * as clock from "../../../../kit/clock.js";
import {
  LegacyLeaderboardReviewValidator,
  defaultLegacyLeaderboardReviewValidator,
} from "./legacy-leaderboard-review-rules.js";
import { LegacyLeaderboardReviewStore } from "./legacy-leaderboard-review-store.js";

/** Moves legacy leaderboard reviews through their life cycle and keeps a journal of what it did. */
export class LegacyLeaderboardReviewDesk {
  store: LegacyLeaderboardReviewStore;
  validator: LegacyLeaderboardReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyLeaderboardReviewStore,
    validator: LegacyLeaderboardReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy leaderboard review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy leaderboard review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newLegacyLeaderboardReviewDesk(store: LegacyLeaderboardReviewStore, clockValue: clock.Clock): LegacyLeaderboardReviewDesk {
  return new LegacyLeaderboardReviewDesk(store, defaultLegacyLeaderboardReviewValidator(), clockValue, []);
}
