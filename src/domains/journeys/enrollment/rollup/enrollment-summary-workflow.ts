import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EnrollmentSummaryEngine, defaultEnrollmentSummaryEngine } from "./enrollment-summary-engine.js";
import { EnrollmentSummaryValidator, defaultEnrollmentSummaryValidator } from "./enrollment-summary-rules.js";
import { EnrollmentSummaryStore } from "./enrollment-summary-store.js";

/** Moves enrollment summaries through their life cycle and keeps a journal of what it did. */
export class EnrollmentSummaryWorkflow {
  store: EnrollmentSummaryStore;
  validator: EnrollmentSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EnrollmentSummaryEngine;

  constructor(
    store: EnrollmentSummaryStore,
    validator: EnrollmentSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EnrollmentSummaryEngine,
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
      throw new Error(`enrollment summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment summary ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEnrollmentSummaryWorkflow(store: EnrollmentSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): EnrollmentSummaryWorkflow {
  return new EnrollmentSummaryWorkflow(
    store,
    defaultEnrollmentSummaryValidator(),
    clockValue,
    [],
    defaultEnrollmentSummaryEngine(flagsValue),
  );
}
