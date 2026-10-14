import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredLeaderboardTemplateEngine,
  defaultTieredLeaderboardTemplateEngine,
} from "./tiered-leaderboard-template-engine.js";
import {
  TieredLeaderboardTemplateValidator,
  defaultTieredLeaderboardTemplateValidator,
} from "./tiered-leaderboard-template-rules.js";
import { TieredLeaderboardTemplateStore } from "./tiered-leaderboard-template-store.js";

/** Moves tiered leaderboard templates through their life cycle and keeps a journal of what it did. */
export class TieredLeaderboardTemplateCoordinator {
  store: TieredLeaderboardTemplateStore;
  validator: TieredLeaderboardTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredLeaderboardTemplateEngine;

  constructor(
    store: TieredLeaderboardTemplateStore,
    validator: TieredLeaderboardTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredLeaderboardTemplateEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered leaderboard template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered leaderboard template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered leaderboard template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newTieredLeaderboardTemplateCoordinator(store: TieredLeaderboardTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredLeaderboardTemplateCoordinator {
  return new TieredLeaderboardTemplateCoordinator(
    store,
    defaultTieredLeaderboardTemplateValidator(),
    clockValue,
    [],
    defaultTieredLeaderboardTemplateEngine(flagsValue),
  );
}
