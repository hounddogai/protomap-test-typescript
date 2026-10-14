import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedMacroScoreEngine, defaultBatchedMacroScoreEngine } from "./batched-macro-score-engine.js";
import { BatchedMacroScoreValidator, defaultBatchedMacroScoreValidator } from "./batched-macro-score-rules.js";
import { BatchedMacroScoreStore } from "./batched-macro-score-store.js";

/** Moves batched macro scores through their life cycle and keeps a journal of what it did. */
export class BatchedMacroScoreWorkflow {
  store: BatchedMacroScoreStore;
  validator: BatchedMacroScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedMacroScoreEngine;

  constructor(
    store: BatchedMacroScoreStore,
    validator: BatchedMacroScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedMacroScoreEngine,
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
      throw new Error(`batched macro score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched macro score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched macro score ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBatchedMacroScoreWorkflow(store: BatchedMacroScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedMacroScoreWorkflow {
  return new BatchedMacroScoreWorkflow(
    store,
    defaultBatchedMacroScoreValidator(),
    clockValue,
    [],
    defaultBatchedMacroScoreEngine(flagsValue),
  );
}
