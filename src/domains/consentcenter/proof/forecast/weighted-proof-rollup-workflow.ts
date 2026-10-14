import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedProofRollupEngine, defaultWeightedProofRollupEngine } from "./weighted-proof-rollup-engine.js";
import { WeightedProofRollupValidator, defaultWeightedProofRollupValidator } from "./weighted-proof-rollup-rules.js";
import { WeightedProofRollupStore } from "./weighted-proof-rollup-store.js";

/** Moves weighted proof rollups through their life cycle and keeps a journal of what it did. */
export class WeightedProofRollupManager {
  store: WeightedProofRollupStore;
  validator: WeightedProofRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedProofRollupEngine;

  constructor(
    store: WeightedProofRollupStore,
    validator: WeightedProofRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedProofRollupEngine,
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
      throw new Error(`weighted proof rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted proof rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted proof rollup ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newWeightedProofRollupManager(store: WeightedProofRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedProofRollupManager {
  return new WeightedProofRollupManager(
    store,
    defaultWeightedProofRollupValidator(),
    clockValue,
    [],
    defaultWeightedProofRollupEngine(flagsValue),
  );
}
