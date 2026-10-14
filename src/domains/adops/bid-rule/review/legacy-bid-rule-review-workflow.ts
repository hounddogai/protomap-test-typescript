import * as clock from "../../../../kit/clock.js";
import { LegacyBidRuleReviewEngine, defaultLegacyBidRuleReviewEngine } from "./legacy-bid-rule-review-engine.js";
import { LegacyBidRuleReviewValidator, defaultLegacyBidRuleReviewValidator } from "./legacy-bid-rule-review-rules.js";
import { LegacyBidRuleReviewStore } from "./legacy-bid-rule-review-store.js";

/** Moves legacy bid rule reviews through their life cycle and keeps a journal of what it did. */
export class LegacyBidRuleReviewWorkflow {
  store: LegacyBidRuleReviewStore;
  validator: LegacyBidRuleReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyBidRuleReviewEngine;

  constructor(
    store: LegacyBidRuleReviewStore,
    validator: LegacyBidRuleReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyBidRuleReviewEngine,
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
      throw new Error(`legacy bid rule review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy bid rule review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy bid rule review ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacyBidRuleReviewWorkflow(store: LegacyBidRuleReviewStore, clockValue: clock.Clock): LegacyBidRuleReviewWorkflow {
  return new LegacyBidRuleReviewWorkflow(
    store,
    defaultLegacyBidRuleReviewValidator(),
    clockValue,
    [],
    defaultLegacyBidRuleReviewEngine(),
  );
}
