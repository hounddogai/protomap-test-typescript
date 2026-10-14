import * as clock from "../../../../kit/clock.js";
import { BatchedWaitPreferenceEngine, defaultBatchedWaitPreferenceEngine } from "./batched-wait-preference-engine.js";
import {
  BatchedWaitPreferenceValidator,
  defaultBatchedWaitPreferenceValidator,
} from "./batched-wait-preference-rules.js";
import { BatchedWaitPreferenceStore } from "./batched-wait-preference-store.js";

/** Moves batched wait preferences through their life cycle and keeps a journal of what it did. */
export class BatchedWaitPreferenceService {
  store: BatchedWaitPreferenceStore;
  validator: BatchedWaitPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedWaitPreferenceEngine;

  constructor(
    store: BatchedWaitPreferenceStore,
    validator: BatchedWaitPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedWaitPreferenceEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched wait preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched wait preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched wait preference ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newBatchedWaitPreferenceService(store: BatchedWaitPreferenceStore, clockValue: clock.Clock): BatchedWaitPreferenceService {
  return new BatchedWaitPreferenceService(
    store,
    defaultBatchedWaitPreferenceValidator(),
    clockValue,
    [],
    defaultBatchedWaitPreferenceEngine(),
  );
}
