import * as clock from "../../../../kit/clock.js";
import { RollingProofScheduleEngine, defaultRollingProofScheduleEngine } from "./rolling-proof-schedule-engine.js";
import {
  RollingProofScheduleValidator,
  defaultRollingProofScheduleValidator,
} from "./rolling-proof-schedule-rules.js";
import { RollingProofScheduleStore } from "./rolling-proof-schedule-store.js";

/** Moves rolling proof schedules through their life cycle and keeps a journal of what it did. */
export class RollingProofScheduleManager {
  store: RollingProofScheduleStore;
  validator: RollingProofScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingProofScheduleEngine;

  constructor(
    store: RollingProofScheduleStore,
    validator: RollingProofScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingProofScheduleEngine,
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
      throw new Error(`rolling proof schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling proof schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling proof schedule ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRollingProofScheduleManager(store: RollingProofScheduleStore, clockValue: clock.Clock): RollingProofScheduleManager {
  return new RollingProofScheduleManager(
    store,
    defaultRollingProofScheduleValidator(),
    clockValue,
    [],
    defaultRollingProofScheduleEngine(),
  );
}
