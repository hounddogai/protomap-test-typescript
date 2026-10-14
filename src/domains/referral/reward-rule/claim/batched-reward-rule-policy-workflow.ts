import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedRewardRulePolicyEngine,
  defaultBatchedRewardRulePolicyEngine,
} from "./batched-reward-rule-policy-engine.js";
import {
  BatchedRewardRulePolicyValidator,
  defaultBatchedRewardRulePolicyValidator,
} from "./batched-reward-rule-policy-rules.js";
import { BatchedRewardRulePolicyStore } from "./batched-reward-rule-policy-store.js";

/** Moves batched reward rule policies through their life cycle and keeps a journal of what it did. */
export class BatchedRewardRulePolicyService {
  store: BatchedRewardRulePolicyStore;
  validator: BatchedRewardRulePolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedRewardRulePolicyEngine;

  constructor(
    store: BatchedRewardRulePolicyStore,
    validator: BatchedRewardRulePolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedRewardRulePolicyEngine,
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
      throw new Error(`batched reward rule policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched reward rule policy ${code} not found`);
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
      throw new Error(`batched reward rule policy ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newBatchedRewardRulePolicyService(store: BatchedRewardRulePolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedRewardRulePolicyService {
  return new BatchedRewardRulePolicyService(
    store,
    defaultBatchedRewardRulePolicyValidator(),
    clockValue,
    [],
    defaultBatchedRewardRulePolicyEngine(flagsValue),
  );
}
