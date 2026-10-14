import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BounceSummaryEngine, defaultBounceSummaryEngine } from "./bounce-summary-engine.js";
import { BounceSummaryValidator, defaultBounceSummaryValidator } from "./bounce-summary-rules.js";
import { BounceSummaryStore } from "./bounce-summary-store.js";

/** Moves bounce summaries through their life cycle and keeps a journal of what it did. */
export class BounceSummaryManager {
  store: BounceSummaryStore;
  validator: BounceSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceSummaryEngine;

  constructor(
    store: BounceSummaryStore,
    validator: BounceSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceSummaryEngine,
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
      throw new Error(`bounce summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce summary ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newBounceSummaryManager(store: BounceSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): BounceSummaryManager {
  return new BounceSummaryManager(
    store,
    defaultBounceSummaryValidator(),
    clockValue,
    [],
    defaultBounceSummaryEngine(flagsValue),
  );
}
