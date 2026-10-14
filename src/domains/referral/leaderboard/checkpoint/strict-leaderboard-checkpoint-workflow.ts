import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  StrictLeaderboardCheckpointEngine,
  defaultStrictLeaderboardCheckpointEngine,
} from "./strict-leaderboard-checkpoint-engine.js";
import {
  StrictLeaderboardCheckpointValidator,
  defaultStrictLeaderboardCheckpointValidator,
} from "./strict-leaderboard-checkpoint-rules.js";
import { StrictLeaderboardCheckpointStore } from "./strict-leaderboard-checkpoint-store.js";

/** Moves strict leaderboard checkpoints through their life cycle and keeps a journal of what it did. */
export class StrictLeaderboardCheckpointWorkflow {
  store: StrictLeaderboardCheckpointStore;
  validator: StrictLeaderboardCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictLeaderboardCheckpointEngine;

  constructor(
    store: StrictLeaderboardCheckpointStore,
    validator: StrictLeaderboardCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictLeaderboardCheckpointEngine,
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
      throw new Error(`strict leaderboard checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict leaderboard checkpoint ${code} not found`);
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
      throw new Error(`strict leaderboard checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictLeaderboardCheckpointWorkflow(store: StrictLeaderboardCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictLeaderboardCheckpointWorkflow {
  return new StrictLeaderboardCheckpointWorkflow(
    store,
    defaultStrictLeaderboardCheckpointValidator(),
    clockValue,
    [],
    defaultStrictLeaderboardCheckpointEngine(flagsValue),
  );
}
