import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedBranchPreferenceEngine,
  defaultWeightedBranchPreferenceEngine,
} from "./weighted-branch-preference-engine.js";
import {
  WeightedBranchPreferenceValidator,
  defaultWeightedBranchPreferenceValidator,
} from "./weighted-branch-preference-rules.js";
import { WeightedBranchPreferenceStore } from "./weighted-branch-preference-store.js";

/** Moves weighted branch preferences through their life cycle and keeps a journal of what it did. */
export class WeightedBranchPreferenceManager {
  store: WeightedBranchPreferenceStore;
  validator: WeightedBranchPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedBranchPreferenceEngine;

  constructor(
    store: WeightedBranchPreferenceStore,
    validator: WeightedBranchPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedBranchPreferenceEngine,
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
      throw new Error(`weighted branch preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted branch preference ${code} not found`);
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
      throw new Error(`weighted branch preference ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newWeightedBranchPreferenceManager(store: WeightedBranchPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedBranchPreferenceManager {
  return new WeightedBranchPreferenceManager(
    store,
    defaultWeightedBranchPreferenceValidator(),
    clockValue,
    [],
    defaultWeightedBranchPreferenceEngine(flagsValue),
  );
}
