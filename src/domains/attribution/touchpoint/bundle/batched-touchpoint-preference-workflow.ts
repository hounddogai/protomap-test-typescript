import * as clock from "../../../../kit/clock.js";
import {
  BatchedTouchpointPreferenceEngine,
  defaultBatchedTouchpointPreferenceEngine,
} from "./batched-touchpoint-preference-engine.js";
import {
  BatchedTouchpointPreferenceValidator,
  defaultBatchedTouchpointPreferenceValidator,
} from "./batched-touchpoint-preference-rules.js";
import { BatchedTouchpointPreferenceStore } from "./batched-touchpoint-preference-store.js";

/** Moves batched touchpoint preferences through their life cycle and keeps a journal of what it did. */
export class BatchedTouchpointPreferenceCoordinator {
  store: BatchedTouchpointPreferenceStore;
  validator: BatchedTouchpointPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedTouchpointPreferenceEngine;

  constructor(
    store: BatchedTouchpointPreferenceStore,
    validator: BatchedTouchpointPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedTouchpointPreferenceEngine,
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
      throw new Error(`batched touchpoint preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched touchpoint preference ${code} not found`);
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
      throw new Error(`batched touchpoint preference ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedTouchpointPreferenceCoordinator(store: BatchedTouchpointPreferenceStore, clockValue: clock.Clock): BatchedTouchpointPreferenceCoordinator {
  return new BatchedTouchpointPreferenceCoordinator(
    store,
    defaultBatchedTouchpointPreferenceValidator(),
    clockValue,
    [],
    defaultBatchedTouchpointPreferenceEngine(),
  );
}
