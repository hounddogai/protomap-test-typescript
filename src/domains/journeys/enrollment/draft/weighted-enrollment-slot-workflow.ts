import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedEnrollmentSlotEngine,
  defaultWeightedEnrollmentSlotEngine,
} from "./weighted-enrollment-slot-engine.js";
import {
  WeightedEnrollmentSlotValidator,
  defaultWeightedEnrollmentSlotValidator,
} from "./weighted-enrollment-slot-rules.js";
import { WeightedEnrollmentSlotStore } from "./weighted-enrollment-slot-store.js";

/** Moves weighted enrollment slots through their life cycle and keeps a journal of what it did. */
export class WeightedEnrollmentSlotWorkflow {
  store: WeightedEnrollmentSlotStore;
  validator: WeightedEnrollmentSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedEnrollmentSlotEngine;

  constructor(
    store: WeightedEnrollmentSlotStore,
    validator: WeightedEnrollmentSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedEnrollmentSlotEngine,
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
      throw new Error(`weighted enrollment slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted enrollment slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted enrollment slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newWeightedEnrollmentSlotWorkflow(store: WeightedEnrollmentSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedEnrollmentSlotWorkflow {
  return new WeightedEnrollmentSlotWorkflow(
    store,
    defaultWeightedEnrollmentSlotValidator(),
    clockValue,
    [],
    defaultWeightedEnrollmentSlotEngine(flagsValue),
  );
}
