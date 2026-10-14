import * as clock from "../../../../kit/clock.js";
import { BidRuleBaselineEngine, defaultBidRuleBaselineEngine } from "./bid-rule-baseline-engine.js";
import { BidRuleBaselineValidator, defaultBidRuleBaselineValidator } from "./bid-rule-baseline-rules.js";
import { BidRuleBaselineStore } from "./bid-rule-baseline-store.js";

/** Moves bid rule baselines through their life cycle and keeps a journal of what it did. */
export class BidRuleBaselineService {
  store: BidRuleBaselineStore;
  validator: BidRuleBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleBaselineEngine;

  constructor(
    store: BidRuleBaselineStore,
    validator: BidRuleBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleBaselineEngine,
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
      throw new Error(`bid rule baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule baseline ${code} not found`);
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
      throw new Error(`bid rule baseline ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBidRuleBaselineService(store: BidRuleBaselineStore, clockValue: clock.Clock): BidRuleBaselineService {
  return new BidRuleBaselineService(
    store,
    defaultBidRuleBaselineValidator(),
    clockValue,
    [],
    defaultBidRuleBaselineEngine(),
  );
}
