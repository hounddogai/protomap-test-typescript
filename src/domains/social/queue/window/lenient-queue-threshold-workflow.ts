import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientQueueThresholdEngine, defaultLenientQueueThresholdEngine } from "./lenient-queue-threshold-engine.js";
import {
  LenientQueueThresholdValidator,
  defaultLenientQueueThresholdValidator,
} from "./lenient-queue-threshold-rules.js";
import { LenientQueueThresholdStore } from "./lenient-queue-threshold-store.js";

/** Moves lenient queue thresholds through their life cycle and keeps a journal of what it did. */
export class LenientQueueThresholdManager {
  store: LenientQueueThresholdStore;
  validator: LenientQueueThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientQueueThresholdEngine;

  constructor(
    store: LenientQueueThresholdStore,
    validator: LenientQueueThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientQueueThresholdEngine,
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
      throw new Error(`lenient queue threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient queue threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient queue threshold ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLenientQueueThresholdManager(store: LenientQueueThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientQueueThresholdManager {
  return new LenientQueueThresholdManager(
    store,
    defaultLenientQueueThresholdValidator(),
    clockValue,
    [],
    defaultLenientQueueThresholdEngine(flagsValue),
  );
}
