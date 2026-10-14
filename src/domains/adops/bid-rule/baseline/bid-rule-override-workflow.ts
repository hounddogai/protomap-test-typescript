import * as clock from "../../../../kit/clock.js";
import { BidRuleOverrideValidator, defaultBidRuleOverrideValidator } from "./bid-rule-override-rules.js";
import { BidRuleOverrideStore } from "./bid-rule-override-store.js";

/** Moves bid rule overrides through their life cycle and keeps a journal of what it did. */
export class BidRuleOverrideService {
  store: BidRuleOverrideStore;
  validator: BidRuleOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BidRuleOverrideStore,
    validator: BidRuleOverrideValidator,
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
      throw new Error(`bid rule override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newBidRuleOverrideService(store: BidRuleOverrideStore, clockValue: clock.Clock): BidRuleOverrideService {
  return new BidRuleOverrideService(store, defaultBidRuleOverrideValidator(), clockValue, []);
}
