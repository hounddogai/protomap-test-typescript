import * as clock from "../../../../kit/clock.js";
import {
  FallbackDoubleOptInBatchEngine,
  defaultFallbackDoubleOptInBatchEngine,
} from "./fallback-double-opt-in-batch-engine.js";
import {
  FallbackDoubleOptInBatchValidator,
  defaultFallbackDoubleOptInBatchValidator,
} from "./fallback-double-opt-in-batch-rules.js";
import { FallbackDoubleOptInBatchStore } from "./fallback-double-opt-in-batch-store.js";

/** Moves fallback double opt in batches through their life cycle and keeps a journal of what it did. */
export class FallbackDoubleOptInBatchService {
  store: FallbackDoubleOptInBatchStore;
  validator: FallbackDoubleOptInBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackDoubleOptInBatchEngine;

  constructor(
    store: FallbackDoubleOptInBatchStore,
    validator: FallbackDoubleOptInBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackDoubleOptInBatchEngine,
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
      throw new Error(`fallback double opt in batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback double opt in batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback double opt in batch ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackDoubleOptInBatchService(store: FallbackDoubleOptInBatchStore, clockValue: clock.Clock): FallbackDoubleOptInBatchService {
  return new FallbackDoubleOptInBatchService(
    store,
    defaultFallbackDoubleOptInBatchValidator(),
    clockValue,
    [],
    defaultFallbackDoubleOptInBatchEngine(),
  );
}
