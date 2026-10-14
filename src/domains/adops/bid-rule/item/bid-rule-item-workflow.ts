import * as clock from "../../../../kit/clock.js";
import { BidRuleItemValidator, defaultBidRuleItemValidator } from "./bid-rule-item-rules.js";
import { BidRuleItemStore } from "./bid-rule-item-store.js";

/** Moves bid rule items through their life cycle and keeps a journal of what it did. */
export class BidRuleItemDesk {
  store: BidRuleItemStore;
  validator: BidRuleItemValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BidRuleItemStore,
    validator: BidRuleItemValidator,
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
      throw new Error(`bid rule item ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule item ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBidRuleItemDesk(store: BidRuleItemStore, clockValue: clock.Clock): BidRuleItemDesk {
  return new BidRuleItemDesk(store, defaultBidRuleItemValidator(), clockValue, []);
}
