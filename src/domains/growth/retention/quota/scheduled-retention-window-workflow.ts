import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledRetentionWindowEngine,
  defaultScheduledRetentionWindowEngine,
} from "./scheduled-retention-window-engine.js";
import {
  ScheduledRetentionWindowValidator,
  defaultScheduledRetentionWindowValidator,
} from "./scheduled-retention-window-rules.js";
import { ScheduledRetentionWindowStore } from "./scheduled-retention-window-store.js";

/** Moves scheduled retention windows through their life cycle and keeps a journal of what it did. */
export class ScheduledRetentionWindowManager {
  store: ScheduledRetentionWindowStore;
  validator: ScheduledRetentionWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledRetentionWindowEngine;

  constructor(
    store: ScheduledRetentionWindowStore,
    validator: ScheduledRetentionWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledRetentionWindowEngine,
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
      throw new Error(`scheduled retention window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled retention window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled retention window ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledRetentionWindowManager(store: ScheduledRetentionWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledRetentionWindowManager {
  return new ScheduledRetentionWindowManager(
    store,
    defaultScheduledRetentionWindowValidator(),
    clockValue,
    [],
    defaultScheduledRetentionWindowEngine(flagsValue),
  );
}
