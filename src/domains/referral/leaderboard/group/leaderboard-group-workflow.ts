import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LeaderboardGroupEngine, defaultLeaderboardGroupEngine } from "./leaderboard-group-engine.js";
import { LeaderboardGroupValidator, defaultLeaderboardGroupValidator } from "./leaderboard-group-rules.js";
import { LeaderboardGroupStore } from "./leaderboard-group-store.js";

/** Moves leaderboard groups through their life cycle and keeps a journal of what it did. */
export class LeaderboardGroupCoordinator {
  store: LeaderboardGroupStore;
  validator: LeaderboardGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardGroupEngine;

  constructor(
    store: LeaderboardGroupStore,
    validator: LeaderboardGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardGroupEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard group ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLeaderboardGroupCoordinator(store: LeaderboardGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): LeaderboardGroupCoordinator {
  return new LeaderboardGroupCoordinator(
    store,
    defaultLeaderboardGroupValidator(),
    clockValue,
    [],
    defaultLeaderboardGroupEngine(flagsValue),
  );
}
