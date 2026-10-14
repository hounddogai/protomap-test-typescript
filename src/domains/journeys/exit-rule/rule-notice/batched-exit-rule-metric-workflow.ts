import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedExitRuleMetricEngine,
  defaultBatchedExitRuleMetricEngine,
} from "./batched-exit-rule-metric-engine.js";
import {
  BatchedExitRuleMetricValidator,
  defaultBatchedExitRuleMetricValidator,
} from "./batched-exit-rule-metric-rules.js";
import { BatchedExitRuleMetricStore } from "./batched-exit-rule-metric-store.js";

/** Moves batched exit rule metrics through their life cycle and keeps a journal of what it did. */
export class BatchedExitRuleMetricWorkflow {
  store: BatchedExitRuleMetricStore;
  validator: BatchedExitRuleMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedExitRuleMetricEngine;

  constructor(
    store: BatchedExitRuleMetricStore,
    validator: BatchedExitRuleMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedExitRuleMetricEngine,
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
      throw new Error(`batched exit rule metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched exit rule metric ${code} not found`);
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
      throw new Error(`batched exit rule metric ${code} not found`);
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

export function newBatchedExitRuleMetricWorkflow(store: BatchedExitRuleMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedExitRuleMetricWorkflow {
  return new BatchedExitRuleMetricWorkflow(
    store,
    defaultBatchedExitRuleMetricValidator(),
    clockValue,
    [],
    defaultBatchedExitRuleMetricEngine(flagsValue),
  );
}
