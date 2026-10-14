import * as clock from "../../../../kit/clock.js";
import { BidRuleRecordValidator, defaultBidRuleRecordValidator } from "./bid-rule-record-rules.js";
import { BidRuleRecordStore } from "./bid-rule-record-store.js";

/** Moves bid rule records through their life cycle and keeps a journal of what it did. */
export class BidRuleRecordManager {
  store: BidRuleRecordStore;
  validator: BidRuleRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BidRuleRecordStore,
    validator: BidRuleRecordValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBidRuleRecordManager(store: BidRuleRecordStore, clockValue: clock.Clock): BidRuleRecordManager {
  return new BidRuleRecordManager(store, defaultBidRuleRecordValidator(), clockValue, []);
}
