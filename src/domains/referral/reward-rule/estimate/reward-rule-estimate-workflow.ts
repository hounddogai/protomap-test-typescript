import * as clock from "../../../../kit/clock.js";
import { RewardRuleEstimateEngine, defaultRewardRuleEstimateEngine } from "./reward-rule-estimate-engine.js";
import { RewardRuleEstimateValidator, defaultRewardRuleEstimateValidator } from "./reward-rule-estimate-rules.js";
import { RewardRuleEstimateStore } from "./reward-rule-estimate-store.js";

/** Moves reward rule estimates through their life cycle and keeps a journal of what it did. */
export class RewardRuleEstimateCoordinator {
  store: RewardRuleEstimateStore;
  validator: RewardRuleEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleEstimateEngine;

  constructor(
    store: RewardRuleEstimateStore,
    validator: RewardRuleEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleEstimateEngine,
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
      throw new Error(`reward rule estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule estimate ${code} not found`);
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
      throw new Error(`reward rule estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRewardRuleEstimateCoordinator(store: RewardRuleEstimateStore, clockValue: clock.Clock): RewardRuleEstimateCoordinator {
  return new RewardRuleEstimateCoordinator(
    store,
    defaultRewardRuleEstimateValidator(),
    clockValue,
    [],
    defaultRewardRuleEstimateEngine(),
  );
}
