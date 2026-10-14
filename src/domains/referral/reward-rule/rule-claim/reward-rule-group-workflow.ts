import * as clock from "../../../../kit/clock.js";
import { RewardRuleGroupEngine, defaultRewardRuleGroupEngine } from "./reward-rule-group-engine.js";
import { RewardRuleGroupValidator, defaultRewardRuleGroupValidator } from "./reward-rule-group-rules.js";
import { RewardRuleGroupStore } from "./reward-rule-group-store.js";

/** Moves reward rule groups through their life cycle and keeps a journal of what it did. */
export class RewardRuleGroupDesk {
  store: RewardRuleGroupStore;
  validator: RewardRuleGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleGroupEngine;

  constructor(
    store: RewardRuleGroupStore,
    validator: RewardRuleGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleGroupEngine,
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
      throw new Error(`reward rule group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule group ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRewardRuleGroupDesk(store: RewardRuleGroupStore, clockValue: clock.Clock): RewardRuleGroupDesk {
  return new RewardRuleGroupDesk(
    store,
    defaultRewardRuleGroupValidator(),
    clockValue,
    [],
    defaultRewardRuleGroupEngine(),
  );
}
