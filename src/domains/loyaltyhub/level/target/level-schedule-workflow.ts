import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LevelScheduleEngine, defaultLevelScheduleEngine } from "./level-schedule-engine.js";
import { LevelScheduleValidator, defaultLevelScheduleValidator } from "./level-schedule-rules.js";
import { LevelScheduleStore } from "./level-schedule-store.js";

/** Moves level schedules through their life cycle and keeps a journal of what it did. */
export class LevelScheduleCoordinator {
  store: LevelScheduleStore;
  validator: LevelScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelScheduleEngine;

  constructor(
    store: LevelScheduleStore,
    validator: LevelScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelScheduleEngine,
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
      throw new Error(`level schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level schedule ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newLevelScheduleCoordinator(store: LevelScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): LevelScheduleCoordinator {
  return new LevelScheduleCoordinator(
    store,
    defaultLevelScheduleValidator(),
    clockValue,
    [],
    defaultLevelScheduleEngine(flagsValue),
  );
}
