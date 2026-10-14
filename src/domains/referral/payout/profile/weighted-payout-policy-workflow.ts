import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedPayoutPolicyEngine, defaultWeightedPayoutPolicyEngine } from "./weighted-payout-policy-engine.js";
import {
  WeightedPayoutPolicyValidator,
  defaultWeightedPayoutPolicyValidator,
} from "./weighted-payout-policy-rules.js";
import { WeightedPayoutPolicyStore } from "./weighted-payout-policy-store.js";

/** Moves weighted payout policies through their life cycle and keeps a journal of what it did. */
export class WeightedPayoutPolicyDesk {
  store: WeightedPayoutPolicyStore;
  validator: WeightedPayoutPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedPayoutPolicyEngine;

  constructor(
    store: WeightedPayoutPolicyStore,
    validator: WeightedPayoutPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedPayoutPolicyEngine,
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
      throw new Error(`weighted payout policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted payout policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted payout policy ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newWeightedPayoutPolicyDesk(store: WeightedPayoutPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedPayoutPolicyDesk {
  return new WeightedPayoutPolicyDesk(
    store,
    defaultWeightedPayoutPolicyValidator(),
    clockValue,
    [],
    defaultWeightedPayoutPolicyEngine(flagsValue),
  );
}
