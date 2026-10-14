import * as clock from "../../../../kit/clock.js";
import { WeightedQueueMappingEngine, defaultWeightedQueueMappingEngine } from "./weighted-queue-mapping-engine.js";
import {
  WeightedQueueMappingValidator,
  defaultWeightedQueueMappingValidator,
} from "./weighted-queue-mapping-rules.js";
import { WeightedQueueMappingStore } from "./weighted-queue-mapping-store.js";

/** Moves weighted queue mappings through their life cycle and keeps a journal of what it did. */
export class WeightedQueueMappingManager {
  store: WeightedQueueMappingStore;
  validator: WeightedQueueMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedQueueMappingEngine;

  constructor(
    store: WeightedQueueMappingStore,
    validator: WeightedQueueMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedQueueMappingEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted queue mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted queue mapping ${code} not found`);
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
      throw new Error(`weighted queue mapping ${code} not found`);
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

export function newWeightedQueueMappingManager(store: WeightedQueueMappingStore, clockValue: clock.Clock): WeightedQueueMappingManager {
  return new WeightedQueueMappingManager(
    store,
    defaultWeightedQueueMappingValidator(),
    clockValue,
    [],
    defaultWeightedQueueMappingEngine(),
  );
}
