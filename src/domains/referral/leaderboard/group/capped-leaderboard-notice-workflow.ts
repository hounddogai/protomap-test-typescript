import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedLeaderboardNoticeEngine,
  defaultCappedLeaderboardNoticeEngine,
} from "./capped-leaderboard-notice-engine.js";
import {
  CappedLeaderboardNoticeValidator,
  defaultCappedLeaderboardNoticeValidator,
} from "./capped-leaderboard-notice-rules.js";
import { CappedLeaderboardNoticeStore } from "./capped-leaderboard-notice-store.js";

/** Moves capped leaderboard notices through their life cycle and keeps a journal of what it did. */
export class CappedLeaderboardNoticeCoordinator {
  store: CappedLeaderboardNoticeStore;
  validator: CappedLeaderboardNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedLeaderboardNoticeEngine;

  constructor(
    store: CappedLeaderboardNoticeStore,
    validator: CappedLeaderboardNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedLeaderboardNoticeEngine,
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
      throw new Error(`capped leaderboard notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped leaderboard notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped leaderboard notice ${code} not found`);
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

export function newCappedLeaderboardNoticeCoordinator(store: CappedLeaderboardNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedLeaderboardNoticeCoordinator {
  return new CappedLeaderboardNoticeCoordinator(
    store,
    defaultCappedLeaderboardNoticeValidator(),
    clockValue,
    [],
    defaultCappedLeaderboardNoticeEngine(flagsValue),
  );
}
