import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LeaderboardAllocationEngine, defaultLeaderboardAllocationEngine } from "./leaderboard-allocation-engine.js";
import {
  LeaderboardAllocationValidator,
  defaultLeaderboardAllocationValidator,
} from "./leaderboard-allocation-rules.js";
import { LeaderboardAllocationStore } from "./leaderboard-allocation-store.js";

/** Moves leaderboard allocations through their life cycle and keeps a journal of what it did. */
export class LeaderboardAllocationService {
  store: LeaderboardAllocationStore;
  validator: LeaderboardAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardAllocationEngine;

  constructor(
    store: LeaderboardAllocationStore,
    validator: LeaderboardAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardAllocationEngine,
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
      throw new Error(`leaderboard allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard allocation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLeaderboardAllocationService(store: LeaderboardAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): LeaderboardAllocationService {
  return new LeaderboardAllocationService(
    store,
    defaultLeaderboardAllocationValidator(),
    clockValue,
    [],
    defaultLeaderboardAllocationEngine(flagsValue),
  );
}
