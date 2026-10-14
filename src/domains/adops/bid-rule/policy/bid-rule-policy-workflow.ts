import * as clock from "../../../../kit/clock.js";
import { BidRulePolicyValidator, defaultBidRulePolicyValidator } from "./bid-rule-policy-rules.js";
import { BidRulePolicyStore } from "./bid-rule-policy-store.js";

/** Moves bid rule policies through their life cycle and keeps a journal of what it did. */
export class BidRulePolicyCoordinator {
  store: BidRulePolicyStore;
  validator: BidRulePolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BidRulePolicyStore,
    validator: BidRulePolicyValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newBidRulePolicyCoordinator(store: BidRulePolicyStore, clockValue: clock.Clock): BidRulePolicyCoordinator {
  return new BidRulePolicyCoordinator(store, defaultBidRulePolicyValidator(), clockValue, []);
}
