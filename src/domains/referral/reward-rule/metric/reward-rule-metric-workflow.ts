import * as clock from "../../../../kit/clock.js";
import { RewardRuleMetricEngine, defaultRewardRuleMetricEngine } from "./reward-rule-metric-engine.js";
import { RewardRuleMetricValidator, defaultRewardRuleMetricValidator } from "./reward-rule-metric-rules.js";
import { RewardRuleMetricStore } from "./reward-rule-metric-store.js";

/** Moves reward rule metrics through their life cycle and keeps a journal of what it did. */
export class RewardRuleMetricCoordinator {
  store: RewardRuleMetricStore;
  validator: RewardRuleMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleMetricEngine;

  constructor(
    store: RewardRuleMetricStore,
    validator: RewardRuleMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleMetricEngine,
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
      throw new Error(`reward rule metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule metric ${code} not found`);
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

export function newRewardRuleMetricCoordinator(store: RewardRuleMetricStore, clockValue: clock.Clock): RewardRuleMetricCoordinator {
  return new RewardRuleMetricCoordinator(
    store,
    defaultRewardRuleMetricValidator(),
    clockValue,
    [],
    defaultRewardRuleMetricEngine(),
  );
}
