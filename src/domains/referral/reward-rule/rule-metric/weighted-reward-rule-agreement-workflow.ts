import * as clock from "../../../../kit/clock.js";
import {
  WeightedRewardRuleAgreementEngine,
  defaultWeightedRewardRuleAgreementEngine,
} from "./weighted-reward-rule-agreement-engine.js";
import {
  WeightedRewardRuleAgreementValidator,
  defaultWeightedRewardRuleAgreementValidator,
} from "./weighted-reward-rule-agreement-rules.js";
import { WeightedRewardRuleAgreementStore } from "./weighted-reward-rule-agreement-store.js";

/** Moves weighted reward rule agreements through their life cycle and keeps a journal of what it did. */
export class WeightedRewardRuleAgreementManager {
  store: WeightedRewardRuleAgreementStore;
  validator: WeightedRewardRuleAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedRewardRuleAgreementEngine;

  constructor(
    store: WeightedRewardRuleAgreementStore,
    validator: WeightedRewardRuleAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedRewardRuleAgreementEngine,
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
      throw new Error(`weighted reward rule agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward rule agreement ${code} not found`);
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
      throw new Error(`weighted reward rule agreement ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedRewardRuleAgreementManager(store: WeightedRewardRuleAgreementStore, clockValue: clock.Clock): WeightedRewardRuleAgreementManager {
  return new WeightedRewardRuleAgreementManager(
    store,
    defaultWeightedRewardRuleAgreementValidator(),
    clockValue,
    [],
    defaultWeightedRewardRuleAgreementEngine(),
  );
}
