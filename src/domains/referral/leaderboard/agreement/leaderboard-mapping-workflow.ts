import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LeaderboardMappingEngine, defaultLeaderboardMappingEngine } from "./leaderboard-mapping-engine.js";
import { LeaderboardMappingValidator, defaultLeaderboardMappingValidator } from "./leaderboard-mapping-rules.js";
import { LeaderboardMappingStore } from "./leaderboard-mapping-store.js";

/** Moves leaderboard mappings through their life cycle and keeps a journal of what it did. */
export class LeaderboardMappingWorkflow {
  store: LeaderboardMappingStore;
  validator: LeaderboardMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardMappingEngine;

  constructor(
    store: LeaderboardMappingStore,
    validator: LeaderboardMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardMappingEngine,
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
      throw new Error(`leaderboard mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard mapping ${code} not found`);
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
      throw new Error(`leaderboard mapping ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLeaderboardMappingWorkflow(store: LeaderboardMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): LeaderboardMappingWorkflow {
  return new LeaderboardMappingWorkflow(
    store,
    defaultLeaderboardMappingValidator(),
    clockValue,
    [],
    defaultLeaderboardMappingEngine(flagsValue),
  );
}
