import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedReputationExceptionEngine,
  defaultWeightedReputationExceptionEngine,
} from "./weighted-reputation-exception-engine.js";
import {
  WeightedReputationExceptionValidator,
  defaultWeightedReputationExceptionValidator,
} from "./weighted-reputation-exception-rules.js";
import { WeightedReputationExceptionStore } from "./weighted-reputation-exception-store.js";

/** Moves weighted reputation exceptions through their life cycle and keeps a journal of what it did. */
export class WeightedReputationExceptionWorkflow {
  store: WeightedReputationExceptionStore;
  validator: WeightedReputationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedReputationExceptionEngine;

  constructor(
    store: WeightedReputationExceptionStore,
    validator: WeightedReputationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedReputationExceptionEngine,
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
      throw new Error(`weighted reputation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reputation exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reputation exception ${code} not found`);
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

export function newWeightedReputationExceptionWorkflow(store: WeightedReputationExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedReputationExceptionWorkflow {
  return new WeightedReputationExceptionWorkflow(
    store,
    defaultWeightedReputationExceptionValidator(),
    clockValue,
    [],
    defaultWeightedReputationExceptionEngine(flagsValue),
  );
}
