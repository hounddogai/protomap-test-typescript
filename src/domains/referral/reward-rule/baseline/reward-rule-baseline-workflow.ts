import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleBaselineEngine, defaultRewardRuleBaselineEngine } from "./reward-rule-baseline-engine.js";
import { RewardRuleBaselineValidator, defaultRewardRuleBaselineValidator } from "./reward-rule-baseline-rules.js";
import { RewardRuleBaselineStore } from "./reward-rule-baseline-store.js";

/** Moves reward rule baselines through their life cycle and keeps a journal of what it did. */
export class RewardRuleBaselineCoordinator {
  store: RewardRuleBaselineStore;
  validator: RewardRuleBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleBaselineEngine;

  constructor(
    store: RewardRuleBaselineStore,
    validator: RewardRuleBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleBaselineEngine,
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
      throw new Error(`reward rule baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule baseline ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRewardRuleBaselineCoordinator(store: RewardRuleBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleBaselineCoordinator {
  return new RewardRuleBaselineCoordinator(
    store,
    defaultRewardRuleBaselineValidator(),
    clockValue,
    [],
    defaultRewardRuleBaselineEngine(flagsValue),
  );
}
