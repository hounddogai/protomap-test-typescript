import * as clock from "../../../../kit/clock.js";
import {
  WeightedTierAllocationEngine,
  defaultWeightedTierAllocationEngine,
} from "./weighted-tier-allocation-engine.js";
import {
  WeightedTierAllocationValidator,
  defaultWeightedTierAllocationValidator,
} from "./weighted-tier-allocation-rules.js";
import { WeightedTierAllocationStore } from "./weighted-tier-allocation-store.js";

/** Moves weighted tier allocations through their life cycle and keeps a journal of what it did. */
export class WeightedTierAllocationCoordinator {
  store: WeightedTierAllocationStore;
  validator: WeightedTierAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedTierAllocationEngine;

  constructor(
    store: WeightedTierAllocationStore,
    validator: WeightedTierAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedTierAllocationEngine,
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
      throw new Error(`weighted tier allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted tier allocation ${code} not found`);
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
      throw new Error(`weighted tier allocation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedTierAllocationCoordinator(store: WeightedTierAllocationStore, clockValue: clock.Clock): WeightedTierAllocationCoordinator {
  return new WeightedTierAllocationCoordinator(
    store,
    defaultWeightedTierAllocationValidator(),
    clockValue,
    [],
    defaultWeightedTierAllocationEngine(),
  );
}
