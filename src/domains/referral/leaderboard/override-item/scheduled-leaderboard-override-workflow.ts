import * as clock from "../../../../kit/clock.js";
import {
  ScheduledLeaderboardOverrideValidator,
  defaultScheduledLeaderboardOverrideValidator,
} from "./scheduled-leaderboard-override-rules.js";
import { ScheduledLeaderboardOverrideStore } from "./scheduled-leaderboard-override-store.js";

/** Moves scheduled leaderboard overrides through their life cycle and keeps a journal of what it did. */
export class ScheduledLeaderboardOverrideCoordinator {
  store: ScheduledLeaderboardOverrideStore;
  validator: ScheduledLeaderboardOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledLeaderboardOverrideStore,
    validator: ScheduledLeaderboardOverrideValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled leaderboard override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled leaderboard override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newScheduledLeaderboardOverrideCoordinator(store: ScheduledLeaderboardOverrideStore, clockValue: clock.Clock): ScheduledLeaderboardOverrideCoordinator {
  return new ScheduledLeaderboardOverrideCoordinator(
    store,
    defaultScheduledLeaderboardOverrideValidator(),
    clockValue,
    [],
  );
}
