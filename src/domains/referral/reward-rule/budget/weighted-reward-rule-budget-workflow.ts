import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedRewardRuleBudgetEngine,
  defaultWeightedRewardRuleBudgetEngine,
} from "./weighted-reward-rule-budget-engine.js";
import {
  WeightedRewardRuleBudgetValidator,
  defaultWeightedRewardRuleBudgetValidator,
} from "./weighted-reward-rule-budget-rules.js";
import { WeightedRewardRuleBudgetStore } from "./weighted-reward-rule-budget-store.js";

/** Moves weighted reward rule budgets through their life cycle and keeps a journal of what it did. */
export class WeightedRewardRuleBudgetService {
  store: WeightedRewardRuleBudgetStore;
  validator: WeightedRewardRuleBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedRewardRuleBudgetEngine;

  constructor(
    store: WeightedRewardRuleBudgetStore,
    validator: WeightedRewardRuleBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedRewardRuleBudgetEngine,
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
      throw new Error(`weighted reward rule budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward rule budget ${code} not found`);
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
      throw new Error(`weighted reward rule budget ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWeightedRewardRuleBudgetService(store: WeightedRewardRuleBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedRewardRuleBudgetService {
  return new WeightedRewardRuleBudgetService(
    store,
    defaultWeightedRewardRuleBudgetValidator(),
    clockValue,
    [],
    defaultWeightedRewardRuleBudgetEngine(flagsValue),
  );
}
