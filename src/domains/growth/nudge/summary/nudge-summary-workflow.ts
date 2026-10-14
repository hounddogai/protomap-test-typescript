import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { NudgeSummaryEngine, defaultNudgeSummaryEngine } from "./nudge-summary-engine.js";
import { NudgeSummaryValidator, defaultNudgeSummaryValidator } from "./nudge-summary-rules.js";
import { NudgeSummaryStore } from "./nudge-summary-store.js";

/** Moves nudge summaries through their life cycle and keeps a journal of what it did. */
export class NudgeSummaryManager {
  store: NudgeSummaryStore;
  validator: NudgeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeSummaryEngine;

  constructor(
    store: NudgeSummaryStore,
    validator: NudgeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeSummaryEngine,
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
      throw new Error(`nudge summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newNudgeSummaryManager(store: NudgeSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): NudgeSummaryManager {
  return new NudgeSummaryManager(
    store,
    defaultNudgeSummaryValidator(),
    clockValue,
    [],
    defaultNudgeSummaryEngine(flagsValue),
  );
}
