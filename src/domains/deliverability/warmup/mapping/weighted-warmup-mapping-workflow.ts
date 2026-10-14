import * as clock from "../../../../kit/clock.js";
import { WeightedWarmupMappingEngine, defaultWeightedWarmupMappingEngine } from "./weighted-warmup-mapping-engine.js";
import {
  WeightedWarmupMappingValidator,
  defaultWeightedWarmupMappingValidator,
} from "./weighted-warmup-mapping-rules.js";
import { WeightedWarmupMappingStore } from "./weighted-warmup-mapping-store.js";

/** Moves weighted warmup mappings through their life cycle and keeps a journal of what it did. */
export class WeightedWarmupMappingService {
  store: WeightedWarmupMappingStore;
  validator: WeightedWarmupMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedWarmupMappingEngine;

  constructor(
    store: WeightedWarmupMappingStore,
    validator: WeightedWarmupMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedWarmupMappingEngine,
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
      throw new Error(`weighted warmup mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted warmup mapping ${code} not found`);
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
      throw new Error(`weighted warmup mapping ${code} not found`);
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

export function newWeightedWarmupMappingService(store: WeightedWarmupMappingStore, clockValue: clock.Clock): WeightedWarmupMappingService {
  return new WeightedWarmupMappingService(
    store,
    defaultWeightedWarmupMappingValidator(),
    clockValue,
    [],
    defaultWeightedWarmupMappingEngine(),
  );
}
