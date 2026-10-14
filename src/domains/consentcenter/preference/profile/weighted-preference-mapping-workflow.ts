import * as clock from "../../../../kit/clock.js";
import {
  WeightedPreferenceMappingEngine,
  defaultWeightedPreferenceMappingEngine,
} from "./weighted-preference-mapping-engine.js";
import {
  WeightedPreferenceMappingValidator,
  defaultWeightedPreferenceMappingValidator,
} from "./weighted-preference-mapping-rules.js";
import { WeightedPreferenceMappingStore } from "./weighted-preference-mapping-store.js";

/** Moves weighted preference mappings through their life cycle and keeps a journal of what it did. */
export class WeightedPreferenceMappingCoordinator {
  store: WeightedPreferenceMappingStore;
  validator: WeightedPreferenceMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedPreferenceMappingEngine;

  constructor(
    store: WeightedPreferenceMappingStore,
    validator: WeightedPreferenceMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedPreferenceMappingEngine,
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
      throw new Error(`weighted preference mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted preference mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted preference mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newWeightedPreferenceMappingCoordinator(store: WeightedPreferenceMappingStore, clockValue: clock.Clock): WeightedPreferenceMappingCoordinator {
  return new WeightedPreferenceMappingCoordinator(
    store,
    defaultWeightedPreferenceMappingValidator(),
    clockValue,
    [],
    defaultWeightedPreferenceMappingEngine(),
  );
}
