import * as clock from "../../../../kit/clock.js";
import { ManualStreakEntryEngine, defaultManualStreakEntryEngine } from "./manual-streak-entry-engine.js";
import { ManualStreakEntryValidator, defaultManualStreakEntryValidator } from "./manual-streak-entry-rules.js";
import { ManualStreakEntryStore } from "./manual-streak-entry-store.js";

/** Moves manual streak entries through their life cycle and keeps a journal of what it did. */
export class ManualStreakEntryCoordinator {
  store: ManualStreakEntryStore;
  validator: ManualStreakEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualStreakEntryEngine;

  constructor(
    store: ManualStreakEntryStore,
    validator: ManualStreakEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualStreakEntryEngine,
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
      throw new Error(`manual streak entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual streak entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual streak entry ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualStreakEntryCoordinator(store: ManualStreakEntryStore, clockValue: clock.Clock): ManualStreakEntryCoordinator {
  return new ManualStreakEntryCoordinator(
    store,
    defaultManualStreakEntryValidator(),
    clockValue,
    [],
    defaultManualStreakEntryEngine(),
  );
}
