import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BidRuleSummaryEngine, defaultBidRuleSummaryEngine } from "./bid-rule-summary-engine.js";
import { BidRuleSummaryValidator, defaultBidRuleSummaryValidator } from "./bid-rule-summary-rules.js";
import { BidRuleSummaryStore } from "./bid-rule-summary-store.js";

/** Moves bid rule summaries through their life cycle and keeps a journal of what it did. */
export class BidRuleSummaryWorkflow {
  store: BidRuleSummaryStore;
  validator: BidRuleSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleSummaryEngine;

  constructor(
    store: BidRuleSummaryStore,
    validator: BidRuleSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleSummaryEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule summary ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBidRuleSummaryWorkflow(store: BidRuleSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): BidRuleSummaryWorkflow {
  return new BidRuleSummaryWorkflow(
    store,
    defaultBidRuleSummaryValidator(),
    clockValue,
    [],
    defaultBidRuleSummaryEngine(flagsValue),
  );
}
