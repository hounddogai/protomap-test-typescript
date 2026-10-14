import * as clock from "../../../../kit/clock.js";
import {
  WeightedFraudCheckQuotaEngine,
  defaultWeightedFraudCheckQuotaEngine,
} from "./weighted-fraud-check-quota-engine.js";
import {
  WeightedFraudCheckQuotaValidator,
  defaultWeightedFraudCheckQuotaValidator,
} from "./weighted-fraud-check-quota-rules.js";
import { WeightedFraudCheckQuotaStore } from "./weighted-fraud-check-quota-store.js";

/** Moves weighted fraud check quotas through their life cycle and keeps a journal of what it did. */
export class WeightedFraudCheckQuotaWorkflow {
  store: WeightedFraudCheckQuotaStore;
  validator: WeightedFraudCheckQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedFraudCheckQuotaEngine;

  constructor(
    store: WeightedFraudCheckQuotaStore,
    validator: WeightedFraudCheckQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedFraudCheckQuotaEngine,
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
      throw new Error(`weighted fraud check quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted fraud check quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted fraud check quota ${code} not found`);
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

export function newWeightedFraudCheckQuotaWorkflow(store: WeightedFraudCheckQuotaStore, clockValue: clock.Clock): WeightedFraudCheckQuotaWorkflow {
  return new WeightedFraudCheckQuotaWorkflow(
    store,
    defaultWeightedFraudCheckQuotaValidator(),
    clockValue,
    [],
    defaultWeightedFraudCheckQuotaEngine(),
  );
}
