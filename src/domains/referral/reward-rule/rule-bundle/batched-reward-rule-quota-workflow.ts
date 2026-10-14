import * as clock from "../../../../kit/clock.js";
import {
  BatchedRewardRuleQuotaValidator,
  defaultBatchedRewardRuleQuotaValidator,
} from "./batched-reward-rule-quota-rules.js";
import { BatchedRewardRuleQuotaStore } from "./batched-reward-rule-quota-store.js";

/** Moves batched reward rule quotas through their life cycle and keeps a journal of what it did. */
export class BatchedRewardRuleQuotaManager {
  store: BatchedRewardRuleQuotaStore;
  validator: BatchedRewardRuleQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedRewardRuleQuotaStore,
    validator: BatchedRewardRuleQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched reward rule quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched reward rule quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newBatchedRewardRuleQuotaManager(store: BatchedRewardRuleQuotaStore, clockValue: clock.Clock): BatchedRewardRuleQuotaManager {
  return new BatchedRewardRuleQuotaManager(store, defaultBatchedRewardRuleQuotaValidator(), clockValue, []);
}
