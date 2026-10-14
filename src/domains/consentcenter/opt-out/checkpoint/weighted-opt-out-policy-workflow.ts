import * as clock from "../../../../kit/clock.js";
import { WeightedOptOutPolicyEngine, defaultWeightedOptOutPolicyEngine } from "./weighted-opt-out-policy-engine.js";
import {
  WeightedOptOutPolicyValidator,
  defaultWeightedOptOutPolicyValidator,
} from "./weighted-opt-out-policy-rules.js";
import { WeightedOptOutPolicyStore } from "./weighted-opt-out-policy-store.js";

/** Moves weighted opt out policies through their life cycle and keeps a journal of what it did. */
export class WeightedOptOutPolicyDesk {
  store: WeightedOptOutPolicyStore;
  validator: WeightedOptOutPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedOptOutPolicyEngine;

  constructor(
    store: WeightedOptOutPolicyStore,
    validator: WeightedOptOutPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedOptOutPolicyEngine,
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
      throw new Error(`weighted opt out policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted opt out policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted opt out policy ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedOptOutPolicyDesk(store: WeightedOptOutPolicyStore, clockValue: clock.Clock): WeightedOptOutPolicyDesk {
  return new WeightedOptOutPolicyDesk(
    store,
    defaultWeightedOptOutPolicyValidator(),
    clockValue,
    [],
    defaultWeightedOptOutPolicyEngine(),
  );
}
