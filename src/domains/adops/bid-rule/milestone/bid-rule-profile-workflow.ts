import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BidRuleProfileEngine, defaultBidRuleProfileEngine } from "./bid-rule-profile-engine.js";
import { BidRuleProfileValidator, defaultBidRuleProfileValidator } from "./bid-rule-profile-rules.js";
import { BidRuleProfileStore } from "./bid-rule-profile-store.js";

/** Moves bid rule profiles through their life cycle and keeps a journal of what it did. */
export class BidRuleProfileDesk {
  store: BidRuleProfileStore;
  validator: BidRuleProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleProfileEngine;

  constructor(
    store: BidRuleProfileStore,
    validator: BidRuleProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleProfileEngine,
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
      throw new Error(`bid rule profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule profile ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBidRuleProfileDesk(store: BidRuleProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): BidRuleProfileDesk {
  return new BidRuleProfileDesk(
    store,
    defaultBidRuleProfileValidator(),
    clockValue,
    [],
    defaultBidRuleProfileEngine(flagsValue),
  );
}
