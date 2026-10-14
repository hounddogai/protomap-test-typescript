import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortBatchEngine, defaultCohortBatchEngine } from "./cohort-batch-engine.js";
import { CohortBatchValidator, defaultCohortBatchValidator } from "./cohort-batch-rules.js";
import { CohortBatchStore } from "./cohort-batch-store.js";

/** Moves cohort batches through their life cycle and keeps a journal of what it did. */
export class CohortBatchWorkflow {
  store: CohortBatchStore;
  validator: CohortBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortBatchEngine;

  constructor(
    store: CohortBatchStore,
    validator: CohortBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortBatchEngine,
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
      throw new Error(`cohort batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort batch ${code} not found`);
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
      throw new Error(`cohort batch ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCohortBatchWorkflow(store: CohortBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortBatchWorkflow {
  return new CohortBatchWorkflow(
    store,
    defaultCohortBatchValidator(),
    clockValue,
    [],
    defaultCohortBatchEngine(flagsValue),
  );
}
