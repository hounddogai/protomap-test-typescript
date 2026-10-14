import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualStreakExceptionEngine, defaultManualStreakExceptionEngine } from "./manual-streak-exception-engine.js";
import {
  ManualStreakExceptionValidator,
  defaultManualStreakExceptionValidator,
} from "./manual-streak-exception-rules.js";
import { ManualStreakExceptionStore } from "./manual-streak-exception-store.js";

/** Moves manual streak exceptions through their life cycle and keeps a journal of what it did. */
export class ManualStreakExceptionService {
  store: ManualStreakExceptionStore;
  validator: ManualStreakExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualStreakExceptionEngine;

  constructor(
    store: ManualStreakExceptionStore,
    validator: ManualStreakExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualStreakExceptionEngine,
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
      throw new Error(`manual streak exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual streak exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual streak exception ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newManualStreakExceptionService(store: ManualStreakExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualStreakExceptionService {
  return new ManualStreakExceptionService(
    store,
    defaultManualStreakExceptionValidator(),
    clockValue,
    [],
    defaultManualStreakExceptionEngine(flagsValue),
  );
}
