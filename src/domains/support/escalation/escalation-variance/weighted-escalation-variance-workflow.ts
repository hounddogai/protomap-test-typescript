import * as clock from "../../../../kit/clock.js";
import {
  WeightedEscalationVarianceEngine,
  defaultWeightedEscalationVarianceEngine,
} from "./weighted-escalation-variance-engine.js";
import {
  WeightedEscalationVarianceValidator,
  defaultWeightedEscalationVarianceValidator,
} from "./weighted-escalation-variance-rules.js";
import { WeightedEscalationVarianceStore } from "./weighted-escalation-variance-store.js";

/** Moves weighted escalation variances through their life cycle and keeps a journal of what it did. */
export class WeightedEscalationVarianceService {
  store: WeightedEscalationVarianceStore;
  validator: WeightedEscalationVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedEscalationVarianceEngine;

  constructor(
    store: WeightedEscalationVarianceStore,
    validator: WeightedEscalationVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedEscalationVarianceEngine,
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
      throw new Error(`weighted escalation variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted escalation variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted escalation variance ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newWeightedEscalationVarianceService(store: WeightedEscalationVarianceStore, clockValue: clock.Clock): WeightedEscalationVarianceService {
  return new WeightedEscalationVarianceService(
    store,
    defaultWeightedEscalationVarianceValidator(),
    clockValue,
    [],
    defaultWeightedEscalationVarianceEngine(),
  );
}
