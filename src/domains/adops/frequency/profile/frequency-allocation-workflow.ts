import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FrequencyAllocationEngine, defaultFrequencyAllocationEngine } from "./frequency-allocation-engine.js";
import { FrequencyAllocationValidator, defaultFrequencyAllocationValidator } from "./frequency-allocation-rules.js";
import { FrequencyAllocationStore } from "./frequency-allocation-store.js";

/** Moves frequency allocations through their life cycle and keeps a journal of what it did. */
export class FrequencyAllocationDesk {
  store: FrequencyAllocationStore;
  validator: FrequencyAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyAllocationEngine;

  constructor(
    store: FrequencyAllocationStore,
    validator: FrequencyAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyAllocationEngine,
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
      throw new Error(`frequency allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency allocation ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFrequencyAllocationDesk(store: FrequencyAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): FrequencyAllocationDesk {
  return new FrequencyAllocationDesk(
    store,
    defaultFrequencyAllocationValidator(),
    clockValue,
    [],
    defaultFrequencyAllocationEngine(flagsValue),
  );
}
