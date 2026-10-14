import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedLevelVarianceEngine, defaultWeightedLevelVarianceEngine } from "./weighted-level-variance-engine.js";
import {
  WeightedLevelVarianceValidator,
  defaultWeightedLevelVarianceValidator,
} from "./weighted-level-variance-rules.js";
import { WeightedLevelVarianceStore } from "./weighted-level-variance-store.js";

/** Moves weighted level variances through their life cycle and keeps a journal of what it did. */
export class WeightedLevelVarianceWorkflow {
  store: WeightedLevelVarianceStore;
  validator: WeightedLevelVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedLevelVarianceEngine;

  constructor(
    store: WeightedLevelVarianceStore,
    validator: WeightedLevelVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedLevelVarianceEngine,
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
      throw new Error(`weighted level variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted level variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted level variance ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWeightedLevelVarianceWorkflow(store: WeightedLevelVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedLevelVarianceWorkflow {
  return new WeightedLevelVarianceWorkflow(
    store,
    defaultWeightedLevelVarianceValidator(),
    clockValue,
    [],
    defaultWeightedLevelVarianceEngine(flagsValue),
  );
}
