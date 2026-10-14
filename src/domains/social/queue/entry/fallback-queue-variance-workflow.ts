import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackQueueVarianceEngine, defaultFallbackQueueVarianceEngine } from "./fallback-queue-variance-engine.js";
import {
  FallbackQueueVarianceValidator,
  defaultFallbackQueueVarianceValidator,
} from "./fallback-queue-variance-rules.js";
import { FallbackQueueVarianceStore } from "./fallback-queue-variance-store.js";

/** Moves fallback queue variances through their life cycle and keeps a journal of what it did. */
export class FallbackQueueVarianceWorkflow {
  store: FallbackQueueVarianceStore;
  validator: FallbackQueueVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackQueueVarianceEngine;

  constructor(
    store: FallbackQueueVarianceStore,
    validator: FallbackQueueVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackQueueVarianceEngine,
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
      throw new Error(`fallback queue variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback queue variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback queue variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFallbackQueueVarianceWorkflow(store: FallbackQueueVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackQueueVarianceWorkflow {
  return new FallbackQueueVarianceWorkflow(
    store,
    defaultFallbackQueueVarianceValidator(),
    clockValue,
    [],
    defaultFallbackQueueVarianceEngine(flagsValue),
  );
}
