import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveLeaderboardSegmentEngine,
  defaultAdaptiveLeaderboardSegmentEngine,
} from "./adaptive-leaderboard-segment-engine.js";
import {
  AdaptiveLeaderboardSegmentValidator,
  defaultAdaptiveLeaderboardSegmentValidator,
} from "./adaptive-leaderboard-segment-rules.js";
import { AdaptiveLeaderboardSegmentStore } from "./adaptive-leaderboard-segment-store.js";

/** Moves adaptive leaderboard segments through their life cycle and keeps a journal of what it did. */
export class AdaptiveLeaderboardSegmentService {
  store: AdaptiveLeaderboardSegmentStore;
  validator: AdaptiveLeaderboardSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveLeaderboardSegmentEngine;

  constructor(
    store: AdaptiveLeaderboardSegmentStore,
    validator: AdaptiveLeaderboardSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveLeaderboardSegmentEngine,
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
      throw new Error(`adaptive leaderboard segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive leaderboard segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive leaderboard segment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newAdaptiveLeaderboardSegmentService(store: AdaptiveLeaderboardSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveLeaderboardSegmentService {
  return new AdaptiveLeaderboardSegmentService(
    store,
    defaultAdaptiveLeaderboardSegmentValidator(),
    clockValue,
    [],
    defaultAdaptiveLeaderboardSegmentEngine(flagsValue),
  );
}
