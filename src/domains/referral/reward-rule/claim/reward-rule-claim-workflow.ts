import * as clock from "../../../../kit/clock.js";
import { RewardRuleClaimEngine, defaultRewardRuleClaimEngine } from "./reward-rule-claim-engine.js";
import { RewardRuleClaimValidator, defaultRewardRuleClaimValidator } from "./reward-rule-claim-rules.js";
import { RewardRuleClaimStore } from "./reward-rule-claim-store.js";

/** Moves reward rule claims through their life cycle and keeps a journal of what it did. */
export class RewardRuleClaimService {
  store: RewardRuleClaimStore;
  validator: RewardRuleClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleClaimEngine;

  constructor(
    store: RewardRuleClaimStore,
    validator: RewardRuleClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleClaimEngine,
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
      throw new Error(`reward rule claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule claim ${code} not found`);
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

export function newRewardRuleClaimService(store: RewardRuleClaimStore, clockValue: clock.Clock): RewardRuleClaimService {
  return new RewardRuleClaimService(
    store,
    defaultRewardRuleClaimValidator(),
    clockValue,
    [],
    defaultRewardRuleClaimEngine(),
  );
}
