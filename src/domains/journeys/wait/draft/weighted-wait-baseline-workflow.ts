import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedWaitBaselineEngine, defaultWeightedWaitBaselineEngine } from "./weighted-wait-baseline-engine.js";
import {
  WeightedWaitBaselineValidator,
  defaultWeightedWaitBaselineValidator,
} from "./weighted-wait-baseline-rules.js";
import { WeightedWaitBaselineStore } from "./weighted-wait-baseline-store.js";

/** Moves weighted wait baselines through their life cycle and keeps a journal of what it did. */
export class WeightedWaitBaselineService {
  store: WeightedWaitBaselineStore;
  validator: WeightedWaitBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedWaitBaselineEngine;

  constructor(
    store: WeightedWaitBaselineStore,
    validator: WeightedWaitBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedWaitBaselineEngine,
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
      throw new Error(`weighted wait baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted wait baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted wait baseline ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newWeightedWaitBaselineService(store: WeightedWaitBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedWaitBaselineService {
  return new WeightedWaitBaselineService(
    store,
    defaultWeightedWaitBaselineValidator(),
    clockValue,
    [],
    defaultWeightedWaitBaselineEngine(flagsValue),
  );
}
