import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  StrictReputationSummaryEngine,
  defaultStrictReputationSummaryEngine,
} from "./strict-reputation-summary-engine.js";
import {
  StrictReputationSummaryValidator,
  defaultStrictReputationSummaryValidator,
} from "./strict-reputation-summary-rules.js";
import { StrictReputationSummaryStore } from "./strict-reputation-summary-store.js";

/** Moves strict reputation summaries through their life cycle and keeps a journal of what it did. */
export class StrictReputationSummaryManager {
  store: StrictReputationSummaryStore;
  validator: StrictReputationSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictReputationSummaryEngine;

  constructor(
    store: StrictReputationSummaryStore,
    validator: StrictReputationSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictReputationSummaryEngine,
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
      throw new Error(`strict reputation summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation summary ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newStrictReputationSummaryManager(store: StrictReputationSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictReputationSummaryManager {
  return new StrictReputationSummaryManager(
    store,
    defaultStrictReputationSummaryValidator(),
    clockValue,
    [],
    defaultStrictReputationSummaryEngine(flagsValue),
  );
}
