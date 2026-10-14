import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedSubscriptionCycleEngine,
  defaultWeightedSubscriptionCycleEngine,
} from "./weighted-subscription-cycle-engine.js";
import {
  WeightedSubscriptionCycleValidator,
  defaultWeightedSubscriptionCycleValidator,
} from "./weighted-subscription-cycle-rules.js";
import { WeightedSubscriptionCycleStore } from "./weighted-subscription-cycle-store.js";

/** Moves weighted subscription cycles through their life cycle and keeps a journal of what it did. */
export class WeightedSubscriptionCycleWorkflow {
  store: WeightedSubscriptionCycleStore;
  validator: WeightedSubscriptionCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedSubscriptionCycleEngine;

  constructor(
    store: WeightedSubscriptionCycleStore,
    validator: WeightedSubscriptionCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedSubscriptionCycleEngine,
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
      throw new Error(`weighted subscription cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted subscription cycle ${code} not found`);
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
      throw new Error(`weighted subscription cycle ${code} not found`);
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

export function newWeightedSubscriptionCycleWorkflow(store: WeightedSubscriptionCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedSubscriptionCycleWorkflow {
  return new WeightedSubscriptionCycleWorkflow(
    store,
    defaultWeightedSubscriptionCycleValidator(),
    clockValue,
    [],
    defaultWeightedSubscriptionCycleEngine(flagsValue),
  );
}
