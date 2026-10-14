import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingSummaryEngine, defaultPacingSummaryEngine } from "./pacing-summary-engine.js";
import { PacingSummaryValidator, defaultPacingSummaryValidator } from "./pacing-summary-rules.js";
import { PacingSummaryStore } from "./pacing-summary-store.js";

/** Moves pacing summaries through their life cycle and keeps a journal of what it did. */
export class PacingSummaryManager {
  store: PacingSummaryStore;
  validator: PacingSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingSummaryEngine;

  constructor(
    store: PacingSummaryStore,
    validator: PacingSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingSummaryEngine,
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
      throw new Error(`pacing summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing summary ${code} not found`);
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
      throw new Error(`pacing summary ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPacingSummaryManager(store: PacingSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingSummaryManager {
  return new PacingSummaryManager(
    store,
    defaultPacingSummaryValidator(),
    clockValue,
    [],
    defaultPacingSummaryEngine(flagsValue),
  );
}
