import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingCreativeSummaryEngine,
  defaultRollingCreativeSummaryEngine,
} from "./rolling-creative-summary-engine.js";
import {
  RollingCreativeSummaryValidator,
  defaultRollingCreativeSummaryValidator,
} from "./rolling-creative-summary-rules.js";
import { RollingCreativeSummaryStore } from "./rolling-creative-summary-store.js";

/** Moves rolling creative summaries through their life cycle and keeps a journal of what it did. */
export class RollingCreativeSummaryManager {
  store: RollingCreativeSummaryStore;
  validator: RollingCreativeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingCreativeSummaryEngine;

  constructor(
    store: RollingCreativeSummaryStore,
    validator: RollingCreativeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingCreativeSummaryEngine,
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
      throw new Error(`rolling creative summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling creative summary ${code} not found`);
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
      throw new Error(`rolling creative summary ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRollingCreativeSummaryManager(store: RollingCreativeSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingCreativeSummaryManager {
  return new RollingCreativeSummaryManager(
    store,
    defaultRollingCreativeSummaryValidator(),
    clockValue,
    [],
    defaultRollingCreativeSummaryEngine(flagsValue),
  );
}
