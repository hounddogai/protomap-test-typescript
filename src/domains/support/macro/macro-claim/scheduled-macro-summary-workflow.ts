import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ScheduledMacroSummaryEngine, defaultScheduledMacroSummaryEngine } from "./scheduled-macro-summary-engine.js";
import {
  ScheduledMacroSummaryValidator,
  defaultScheduledMacroSummaryValidator,
} from "./scheduled-macro-summary-rules.js";
import { ScheduledMacroSummaryStore } from "./scheduled-macro-summary-store.js";

/** Moves scheduled macro summaries through their life cycle and keeps a journal of what it did. */
export class ScheduledMacroSummaryManager {
  store: ScheduledMacroSummaryStore;
  validator: ScheduledMacroSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledMacroSummaryEngine;

  constructor(
    store: ScheduledMacroSummaryStore,
    validator: ScheduledMacroSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledMacroSummaryEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled macro summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled macro summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled macro summary ${code} not found`);
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

export function newScheduledMacroSummaryManager(store: ScheduledMacroSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledMacroSummaryManager {
  return new ScheduledMacroSummaryManager(
    store,
    defaultScheduledMacroSummaryValidator(),
    clockValue,
    [],
    defaultScheduledMacroSummaryEngine(flagsValue),
  );
}
