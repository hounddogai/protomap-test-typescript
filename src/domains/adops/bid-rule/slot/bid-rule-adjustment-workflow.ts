import * as clock from "../../../../kit/clock.js";
import { BidRuleAdjustmentEngine, defaultBidRuleAdjustmentEngine } from "./bid-rule-adjustment-engine.js";
import { BidRuleAdjustmentValidator, defaultBidRuleAdjustmentValidator } from "./bid-rule-adjustment-rules.js";
import { BidRuleAdjustmentStore } from "./bid-rule-adjustment-store.js";

/** Moves bid rule adjustments through their life cycle and keeps a journal of what it did. */
export class BidRuleAdjustmentDesk {
  store: BidRuleAdjustmentStore;
  validator: BidRuleAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleAdjustmentEngine;

  constructor(
    store: BidRuleAdjustmentStore,
    validator: BidRuleAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleAdjustmentEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule adjustment ${code} not found`);
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
      throw new Error(`bid rule adjustment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBidRuleAdjustmentDesk(store: BidRuleAdjustmentStore, clockValue: clock.Clock): BidRuleAdjustmentDesk {
  return new BidRuleAdjustmentDesk(
    store,
    defaultBidRuleAdjustmentValidator(),
    clockValue,
    [],
    defaultBidRuleAdjustmentEngine(),
  );
}
