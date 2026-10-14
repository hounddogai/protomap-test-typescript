import * as clock from "../../../../kit/clock.js";
import {
  LegacyWarmupAllocationEngine,
  defaultLegacyWarmupAllocationEngine,
} from "./legacy-warmup-allocation-engine.js";
import {
  LegacyWarmupAllocationValidator,
  defaultLegacyWarmupAllocationValidator,
} from "./legacy-warmup-allocation-rules.js";
import { LegacyWarmupAllocationStore } from "./legacy-warmup-allocation-store.js";

/** Moves legacy warmup allocations through their life cycle and keeps a journal of what it did. */
export class LegacyWarmupAllocationManager {
  store: LegacyWarmupAllocationStore;
  validator: LegacyWarmupAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyWarmupAllocationEngine;

  constructor(
    store: LegacyWarmupAllocationStore,
    validator: LegacyWarmupAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyWarmupAllocationEngine,
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
      throw new Error(`legacy warmup allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy warmup allocation ${code} not found`);
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
      throw new Error(`legacy warmup allocation ${code} not found`);
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

export function newLegacyWarmupAllocationManager(store: LegacyWarmupAllocationStore, clockValue: clock.Clock): LegacyWarmupAllocationManager {
  return new LegacyWarmupAllocationManager(
    store,
    defaultLegacyWarmupAllocationValidator(),
    clockValue,
    [],
    defaultLegacyWarmupAllocationEngine(),
  );
}
