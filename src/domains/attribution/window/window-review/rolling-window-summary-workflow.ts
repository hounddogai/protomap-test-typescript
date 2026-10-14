import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingWindowSummaryEngine, defaultRollingWindowSummaryEngine } from "./rolling-window-summary-engine.js";
import {
  RollingWindowSummaryValidator,
  defaultRollingWindowSummaryValidator,
} from "./rolling-window-summary-rules.js";
import { RollingWindowSummaryStore } from "./rolling-window-summary-store.js";

/** Moves rolling window summaries through their life cycle and keeps a journal of what it did. */
export class RollingWindowSummaryManager {
  store: RollingWindowSummaryStore;
  validator: RollingWindowSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingWindowSummaryEngine;

  constructor(
    store: RollingWindowSummaryStore,
    validator: RollingWindowSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingWindowSummaryEngine,
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
      throw new Error(`rolling window summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling window summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling window summary ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRollingWindowSummaryManager(store: RollingWindowSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingWindowSummaryManager {
  return new RollingWindowSummaryManager(
    store,
    defaultRollingWindowSummaryValidator(),
    clockValue,
    [],
    defaultRollingWindowSummaryEngine(flagsValue),
  );
}
