import * as clock from "../../../../kit/clock.js";
import { StrictPostSummaryEngine, defaultStrictPostSummaryEngine } from "./strict-post-summary-engine.js";
import { StrictPostSummaryValidator, defaultStrictPostSummaryValidator } from "./strict-post-summary-rules.js";
import { StrictPostSummaryStore } from "./strict-post-summary-store.js";

/** Moves strict post summaries through their life cycle and keeps a journal of what it did. */
export class StrictPostSummaryWorkflow {
  store: StrictPostSummaryStore;
  validator: StrictPostSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPostSummaryEngine;

  constructor(
    store: StrictPostSummaryStore,
    validator: StrictPostSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPostSummaryEngine,
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
      throw new Error(`strict post summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict post summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict post summary ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newStrictPostSummaryWorkflow(store: StrictPostSummaryStore, clockValue: clock.Clock): StrictPostSummaryWorkflow {
  return new StrictPostSummaryWorkflow(
    store,
    defaultStrictPostSummaryValidator(),
    clockValue,
    [],
    defaultStrictPostSummaryEngine(),
  );
}
