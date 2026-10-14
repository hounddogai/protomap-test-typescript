import * as clock from "../../../../kit/clock.js";
import { RewardRuleWindowEngine, defaultRewardRuleWindowEngine } from "./reward-rule-window-engine.js";
import { RewardRuleWindowValidator, defaultRewardRuleWindowValidator } from "./reward-rule-window-rules.js";
import { RewardRuleWindowStore } from "./reward-rule-window-store.js";

/** Moves reward rule windows through their life cycle and keeps a journal of what it did. */
export class RewardRuleWindowWorkflow {
  store: RewardRuleWindowStore;
  validator: RewardRuleWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleWindowEngine;

  constructor(
    store: RewardRuleWindowStore,
    validator: RewardRuleWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleWindowEngine,
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
      throw new Error(`reward rule window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule window ${code} not found`);
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
      throw new Error(`reward rule window ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newRewardRuleWindowWorkflow(store: RewardRuleWindowStore, clockValue: clock.Clock): RewardRuleWindowWorkflow {
  return new RewardRuleWindowWorkflow(
    store,
    defaultRewardRuleWindowValidator(),
    clockValue,
    [],
    defaultRewardRuleWindowEngine(),
  );
}
