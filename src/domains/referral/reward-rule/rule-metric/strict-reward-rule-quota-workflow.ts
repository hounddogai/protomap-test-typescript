import * as clock from "../../../../kit/clock.js";
import {
  StrictRewardRuleQuotaValidator,
  defaultStrictRewardRuleQuotaValidator,
} from "./strict-reward-rule-quota-rules.js";
import { StrictRewardRuleQuotaStore } from "./strict-reward-rule-quota-store.js";

/** Moves strict reward rule quotas through their life cycle and keeps a journal of what it did. */
export class StrictRewardRuleQuotaWorkflow {
  store: StrictRewardRuleQuotaStore;
  validator: StrictRewardRuleQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictRewardRuleQuotaStore,
    validator: StrictRewardRuleQuotaValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reward rule quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reward rule quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictRewardRuleQuotaWorkflow(store: StrictRewardRuleQuotaStore, clockValue: clock.Clock): StrictRewardRuleQuotaWorkflow {
  return new StrictRewardRuleQuotaWorkflow(store, defaultStrictRewardRuleQuotaValidator(), clockValue, []);
}
