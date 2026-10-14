import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledLeaderboardTemplateEngine,
  defaultScheduledLeaderboardTemplateEngine,
} from "./scheduled-leaderboard-template-engine.js";
import {
  ScheduledLeaderboardTemplateValidator,
  defaultScheduledLeaderboardTemplateValidator,
} from "./scheduled-leaderboard-template-rules.js";
import { ScheduledLeaderboardTemplateStore } from "./scheduled-leaderboard-template-store.js";

/** Moves scheduled leaderboard templates through their life cycle and keeps a journal of what it did. */
export class ScheduledLeaderboardTemplateManager {
  store: ScheduledLeaderboardTemplateStore;
  validator: ScheduledLeaderboardTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledLeaderboardTemplateEngine;

  constructor(
    store: ScheduledLeaderboardTemplateStore,
    validator: ScheduledLeaderboardTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledLeaderboardTemplateEngine,
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
      throw new Error(`scheduled leaderboard template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled leaderboard template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled leaderboard template ${code} not found`);
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

export function newScheduledLeaderboardTemplateManager(store: ScheduledLeaderboardTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledLeaderboardTemplateManager {
  return new ScheduledLeaderboardTemplateManager(
    store,
    defaultScheduledLeaderboardTemplateValidator(),
    clockValue,
    [],
    defaultScheduledLeaderboardTemplateEngine(flagsValue),
  );
}
