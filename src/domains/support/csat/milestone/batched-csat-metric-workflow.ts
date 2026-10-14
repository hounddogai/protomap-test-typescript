import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedCsatMetricEngine, defaultBatchedCsatMetricEngine } from "./batched-csat-metric-engine.js";
import { BatchedCsatMetricValidator, defaultBatchedCsatMetricValidator } from "./batched-csat-metric-rules.js";
import { BatchedCsatMetricStore } from "./batched-csat-metric-store.js";

/** Moves batched csat metrics through their life cycle and keeps a journal of what it did. */
export class BatchedCsatMetricCoordinator {
  store: BatchedCsatMetricStore;
  validator: BatchedCsatMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedCsatMetricEngine;

  constructor(
    store: BatchedCsatMetricStore,
    validator: BatchedCsatMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedCsatMetricEngine,
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
      throw new Error(`batched csat metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched csat metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched csat metric ${code} not found`);
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

export function newBatchedCsatMetricCoordinator(store: BatchedCsatMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedCsatMetricCoordinator {
  return new BatchedCsatMetricCoordinator(
    store,
    defaultBatchedCsatMetricValidator(),
    clockValue,
    [],
    defaultBatchedCsatMetricEngine(flagsValue),
  );
}
