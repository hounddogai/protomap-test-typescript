import * as clock from "../../../../kit/clock.js";
import {
  ManualLeaderboardAdjustmentEngine,
  defaultManualLeaderboardAdjustmentEngine,
} from "./manual-leaderboard-adjustment-engine.js";
import {
  ManualLeaderboardAdjustmentValidator,
  defaultManualLeaderboardAdjustmentValidator,
} from "./manual-leaderboard-adjustment-rules.js";
import { ManualLeaderboardAdjustmentStore } from "./manual-leaderboard-adjustment-store.js";

/** Moves manual leaderboard adjustments through their life cycle and keeps a journal of what it did. */
export class ManualLeaderboardAdjustmentCoordinator {
  store: ManualLeaderboardAdjustmentStore;
  validator: ManualLeaderboardAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualLeaderboardAdjustmentEngine;

  constructor(
    store: ManualLeaderboardAdjustmentStore,
    validator: ManualLeaderboardAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualLeaderboardAdjustmentEngine,
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
      throw new Error(`manual leaderboard adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual leaderboard adjustment ${code} not found`);
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
      throw new Error(`manual leaderboard adjustment ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newManualLeaderboardAdjustmentCoordinator(store: ManualLeaderboardAdjustmentStore, clockValue: clock.Clock): ManualLeaderboardAdjustmentCoordinator {
  return new ManualLeaderboardAdjustmentCoordinator(
    store,
    defaultManualLeaderboardAdjustmentValidator(),
    clockValue,
    [],
    defaultManualLeaderboardAdjustmentEngine(),
  );
}
