import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ScheduledWindowBatchEngine, defaultScheduledWindowBatchEngine } from "./scheduled-window-batch-engine.js";
import {
  ScheduledWindowBatchValidator,
  defaultScheduledWindowBatchValidator,
} from "./scheduled-window-batch-rules.js";
import { ScheduledWindowBatchStore } from "./scheduled-window-batch-store.js";

/** Moves scheduled window batches through their life cycle and keeps a journal of what it did. */
export class ScheduledWindowBatchWorkflow {
  store: ScheduledWindowBatchStore;
  validator: ScheduledWindowBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledWindowBatchEngine;

  constructor(
    store: ScheduledWindowBatchStore,
    validator: ScheduledWindowBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledWindowBatchEngine,
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
      throw new Error(`scheduled window batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled window batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled window batch ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newScheduledWindowBatchWorkflow(store: ScheduledWindowBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledWindowBatchWorkflow {
  return new ScheduledWindowBatchWorkflow(
    store,
    defaultScheduledWindowBatchValidator(),
    clockValue,
    [],
    defaultScheduledWindowBatchEngine(flagsValue),
  );
}
