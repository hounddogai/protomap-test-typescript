import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LeaderboardSummaryEngine, defaultLeaderboardSummaryEngine } from "./leaderboard-summary-engine.js";
import { LeaderboardSummaryValidator, defaultLeaderboardSummaryValidator } from "./leaderboard-summary-rules.js";
import { LeaderboardSummaryStore } from "./leaderboard-summary-store.js";

/** Moves leaderboard summaries through their life cycle and keeps a journal of what it did. */
export class LeaderboardSummaryDesk {
  store: LeaderboardSummaryStore;
  validator: LeaderboardSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LeaderboardSummaryEngine;

  constructor(
    store: LeaderboardSummaryStore,
    validator: LeaderboardSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LeaderboardSummaryEngine,
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
      throw new Error(`leaderboard summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard summary ${code} not found`);
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
      throw new Error(`leaderboard summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLeaderboardSummaryDesk(store: LeaderboardSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): LeaderboardSummaryDesk {
  return new LeaderboardSummaryDesk(
    store,
    defaultLeaderboardSummaryValidator(),
    clockValue,
    [],
    defaultLeaderboardSummaryEngine(flagsValue),
  );
}
