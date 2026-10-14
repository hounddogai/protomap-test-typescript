import * as clock from "../../../../kit/clock.js";
import { LevelMetricEngine, defaultLevelMetricEngine } from "./level-metric-engine.js";
import { LevelMetricValidator, defaultLevelMetricValidator } from "./level-metric-rules.js";
import { LevelMetricStore } from "./level-metric-store.js";

/** Moves level metrics through their life cycle and keeps a journal of what it did. */
export class LevelMetricDesk {
  store: LevelMetricStore;
  validator: LevelMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelMetricEngine;

  constructor(
    store: LevelMetricStore,
    validator: LevelMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelMetricEngine,
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
      throw new Error(`level metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level metric ${code} not found`);
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
      throw new Error(`level metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLevelMetricDesk(store: LevelMetricStore, clockValue: clock.Clock): LevelMetricDesk {
  return new LevelMetricDesk(store, defaultLevelMetricValidator(), clockValue, [], defaultLevelMetricEngine());
}
