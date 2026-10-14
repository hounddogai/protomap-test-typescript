import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyLeaderboardDraftEngine,
  defaultLegacyLeaderboardDraftEngine,
} from "./legacy-leaderboard-draft-engine.js";
import {
  LegacyLeaderboardDraftValidator,
  defaultLegacyLeaderboardDraftValidator,
} from "./legacy-leaderboard-draft-rules.js";
import { LegacyLeaderboardDraftStore } from "./legacy-leaderboard-draft-store.js";

/** Moves legacy leaderboard drafts through their life cycle and keeps a journal of what it did. */
export class LegacyLeaderboardDraftCoordinator {
  store: LegacyLeaderboardDraftStore;
  validator: LegacyLeaderboardDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyLeaderboardDraftEngine;

  constructor(
    store: LegacyLeaderboardDraftStore,
    validator: LegacyLeaderboardDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyLeaderboardDraftEngine,
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
      throw new Error(`legacy leaderboard draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy leaderboard draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy leaderboard draft ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newLegacyLeaderboardDraftCoordinator(store: LegacyLeaderboardDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyLeaderboardDraftCoordinator {
  return new LegacyLeaderboardDraftCoordinator(
    store,
    defaultLegacyLeaderboardDraftValidator(),
    clockValue,
    [],
    defaultLegacyLeaderboardDraftEngine(flagsValue),
  );
}
