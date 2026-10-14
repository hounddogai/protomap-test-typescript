import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedCreativeEntryEngine, defaultWeightedCreativeEntryEngine } from "./weighted-creative-entry-engine.js";
import {
  WeightedCreativeEntryValidator,
  defaultWeightedCreativeEntryValidator,
} from "./weighted-creative-entry-rules.js";
import { WeightedCreativeEntryStore } from "./weighted-creative-entry-store.js";

/** Moves weighted creative entries through their life cycle and keeps a journal of what it did. */
export class WeightedCreativeEntryWorkflow {
  store: WeightedCreativeEntryStore;
  validator: WeightedCreativeEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedCreativeEntryEngine;

  constructor(
    store: WeightedCreativeEntryStore,
    validator: WeightedCreativeEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedCreativeEntryEngine,
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
      throw new Error(`weighted creative entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted creative entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted creative entry ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWeightedCreativeEntryWorkflow(store: WeightedCreativeEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedCreativeEntryWorkflow {
  return new WeightedCreativeEntryWorkflow(
    store,
    defaultWeightedCreativeEntryValidator(),
    clockValue,
    [],
    defaultWeightedCreativeEntryEngine(flagsValue),
  );
}
