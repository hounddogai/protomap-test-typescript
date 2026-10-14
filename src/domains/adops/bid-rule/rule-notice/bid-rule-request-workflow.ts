import * as clock from "../../../../kit/clock.js";
import { BidRuleRequestEngine, defaultBidRuleRequestEngine } from "./bid-rule-request-engine.js";
import { BidRuleRequestValidator, defaultBidRuleRequestValidator } from "./bid-rule-request-rules.js";
import { BidRuleRequestStore } from "./bid-rule-request-store.js";

/** Moves bid rule requests through their life cycle and keeps a journal of what it did. */
export class BidRuleRequestDesk {
  store: BidRuleRequestStore;
  validator: BidRuleRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleRequestEngine;

  constructor(
    store: BidRuleRequestStore,
    validator: BidRuleRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleRequestEngine,
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
      throw new Error(`bid rule request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule request ${code} not found`);
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

export function newBidRuleRequestDesk(store: BidRuleRequestStore, clockValue: clock.Clock): BidRuleRequestDesk {
  return new BidRuleRequestDesk(store, defaultBidRuleRequestValidator(), clockValue, [], defaultBidRuleRequestEngine());
}
