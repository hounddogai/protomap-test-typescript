import * as clock from "../../../../kit/clock.js";
import { BounceThresholdEngine, defaultBounceThresholdEngine } from "./bounce-threshold-engine.js";
import { BounceThresholdValidator, defaultBounceThresholdValidator } from "./bounce-threshold-rules.js";
import { BounceThresholdStore } from "./bounce-threshold-store.js";

/** Moves bounce thresholds through their life cycle and keeps a journal of what it did. */
export class BounceThresholdWorkflow {
  store: BounceThresholdStore;
  validator: BounceThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceThresholdEngine;

  constructor(
    store: BounceThresholdStore,
    validator: BounceThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceThresholdEngine,
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
      throw new Error(`bounce threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce threshold ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newBounceThresholdWorkflow(store: BounceThresholdStore, clockValue: clock.Clock): BounceThresholdWorkflow {
  return new BounceThresholdWorkflow(
    store,
    defaultBounceThresholdValidator(),
    clockValue,
    [],
    defaultBounceThresholdEngine(),
  );
}
