import * as clock from "../../../../kit/clock.js";
import { RewardRuleOverrideEngine, defaultRewardRuleOverrideEngine } from "./reward-rule-override-engine.js";
import { RewardRuleOverrideValidator, defaultRewardRuleOverrideValidator } from "./reward-rule-override-rules.js";
import { RewardRuleOverrideStore } from "./reward-rule-override-store.js";

/** Moves reward rule overrides through their life cycle and keeps a journal of what it did. */
export class RewardRuleOverrideWorkflow {
  store: RewardRuleOverrideStore;
  validator: RewardRuleOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleOverrideEngine;

  constructor(
    store: RewardRuleOverrideStore,
    validator: RewardRuleOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleOverrideEngine,
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
      throw new Error(`reward rule override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule override ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRewardRuleOverrideWorkflow(store: RewardRuleOverrideStore, clockValue: clock.Clock): RewardRuleOverrideWorkflow {
  return new RewardRuleOverrideWorkflow(
    store,
    defaultRewardRuleOverrideValidator(),
    clockValue,
    [],
    defaultRewardRuleOverrideEngine(),
  );
}
