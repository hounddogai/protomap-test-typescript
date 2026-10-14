import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledRetentionCycleEngine,
  defaultScheduledRetentionCycleEngine,
} from "./scheduled-retention-cycle-engine.js";
import {
  ScheduledRetentionCycleValidator,
  defaultScheduledRetentionCycleValidator,
} from "./scheduled-retention-cycle-rules.js";
import { ScheduledRetentionCycleStore } from "./scheduled-retention-cycle-store.js";

/** Moves scheduled retention cycles through their life cycle and keeps a journal of what it did. */
export class ScheduledRetentionCycleService {
  store: ScheduledRetentionCycleStore;
  validator: ScheduledRetentionCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledRetentionCycleEngine;

  constructor(
    store: ScheduledRetentionCycleStore,
    validator: ScheduledRetentionCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledRetentionCycleEngine,
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
      throw new Error(`scheduled retention cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled retention cycle ${code} not found`);
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
      throw new Error(`scheduled retention cycle ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newScheduledRetentionCycleService(store: ScheduledRetentionCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledRetentionCycleService {
  return new ScheduledRetentionCycleService(
    store,
    defaultScheduledRetentionCycleValidator(),
    clockValue,
    [],
    defaultScheduledRetentionCycleEngine(flagsValue),
  );
}
