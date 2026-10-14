import * as clock from "../../../../kit/clock.js";
import { RewardRuleRollupEngine, defaultRewardRuleRollupEngine } from "./reward-rule-rollup-engine.js";
import { RewardRuleRollupValidator, defaultRewardRuleRollupValidator } from "./reward-rule-rollup-rules.js";
import { RewardRuleRollupStore } from "./reward-rule-rollup-store.js";

/** Moves reward rule rollups through their life cycle and keeps a journal of what it did. */
export class RewardRuleRollupCoordinator {
  store: RewardRuleRollupStore;
  validator: RewardRuleRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleRollupEngine;

  constructor(
    store: RewardRuleRollupStore,
    validator: RewardRuleRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleRollupEngine,
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
      throw new Error(`reward rule rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule rollup ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRewardRuleRollupCoordinator(store: RewardRuleRollupStore, clockValue: clock.Clock): RewardRuleRollupCoordinator {
  return new RewardRuleRollupCoordinator(
    store,
    defaultRewardRuleRollupValidator(),
    clockValue,
    [],
    defaultRewardRuleRollupEngine(),
  );
}
