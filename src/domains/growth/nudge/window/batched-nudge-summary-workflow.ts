import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedNudgeSummaryEngine, defaultBatchedNudgeSummaryEngine } from "./batched-nudge-summary-engine.js";
import { BatchedNudgeSummaryValidator, defaultBatchedNudgeSummaryValidator } from "./batched-nudge-summary-rules.js";
import { BatchedNudgeSummaryStore } from "./batched-nudge-summary-store.js";

/** Moves batched nudge summaries through their life cycle and keeps a journal of what it did. */
export class BatchedNudgeSummaryWorkflow {
  store: BatchedNudgeSummaryStore;
  validator: BatchedNudgeSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedNudgeSummaryEngine;

  constructor(
    store: BatchedNudgeSummaryStore,
    validator: BatchedNudgeSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedNudgeSummaryEngine,
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
      throw new Error(`batched nudge summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched nudge summary ${code} not found`);
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
      throw new Error(`batched nudge summary ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedNudgeSummaryWorkflow(store: BatchedNudgeSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedNudgeSummaryWorkflow {
  return new BatchedNudgeSummaryWorkflow(
    store,
    defaultBatchedNudgeSummaryValidator(),
    clockValue,
    [],
    defaultBatchedNudgeSummaryEngine(flagsValue),
  );
}
