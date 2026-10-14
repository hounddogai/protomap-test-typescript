import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedPacingScheduleEngine, defaultCappedPacingScheduleEngine } from "./capped-pacing-schedule-engine.js";
import {
  CappedPacingScheduleValidator,
  defaultCappedPacingScheduleValidator,
} from "./capped-pacing-schedule-rules.js";
import { CappedPacingScheduleStore } from "./capped-pacing-schedule-store.js";

/** Moves capped pacing schedules through their life cycle and keeps a journal of what it did. */
export class CappedPacingScheduleCoordinator {
  store: CappedPacingScheduleStore;
  validator: CappedPacingScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedPacingScheduleEngine;

  constructor(
    store: CappedPacingScheduleStore,
    validator: CappedPacingScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedPacingScheduleEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped pacing schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped pacing schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped pacing schedule ${code} not found`);
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

export function newCappedPacingScheduleCoordinator(store: CappedPacingScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedPacingScheduleCoordinator {
  return new CappedPacingScheduleCoordinator(
    store,
    defaultCappedPacingScheduleValidator(),
    clockValue,
    [],
    defaultCappedPacingScheduleEngine(flagsValue),
  );
}
