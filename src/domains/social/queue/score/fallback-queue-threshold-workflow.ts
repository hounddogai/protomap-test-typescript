import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackQueueThresholdEngine,
  defaultFallbackQueueThresholdEngine,
} from "./fallback-queue-threshold-engine.js";
import {
  FallbackQueueThresholdValidator,
  defaultFallbackQueueThresholdValidator,
} from "./fallback-queue-threshold-rules.js";
import { FallbackQueueThresholdStore } from "./fallback-queue-threshold-store.js";

/** Moves fallback queue thresholds through their life cycle and keeps a journal of what it did. */
export class FallbackQueueThresholdManager {
  store: FallbackQueueThresholdStore;
  validator: FallbackQueueThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackQueueThresholdEngine;

  constructor(
    store: FallbackQueueThresholdStore,
    validator: FallbackQueueThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackQueueThresholdEngine,
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
      throw new Error(`fallback queue threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback queue threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback queue threshold ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newFallbackQueueThresholdManager(store: FallbackQueueThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackQueueThresholdManager {
  return new FallbackQueueThresholdManager(
    store,
    defaultFallbackQueueThresholdValidator(),
    clockValue,
    [],
    defaultFallbackQueueThresholdEngine(flagsValue),
  );
}
