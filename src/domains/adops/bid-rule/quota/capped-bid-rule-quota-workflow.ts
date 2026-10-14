import * as clock from "../../../../kit/clock.js";
import { CappedBidRuleQuotaEngine, defaultCappedBidRuleQuotaEngine } from "./capped-bid-rule-quota-engine.js";
import { CappedBidRuleQuotaValidator, defaultCappedBidRuleQuotaValidator } from "./capped-bid-rule-quota-rules.js";
import { CappedBidRuleQuotaStore } from "./capped-bid-rule-quota-store.js";

/** Moves capped bid rule quotas through their life cycle and keeps a journal of what it did. */
export class CappedBidRuleQuotaCoordinator {
  store: CappedBidRuleQuotaStore;
  validator: CappedBidRuleQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedBidRuleQuotaEngine;

  constructor(
    store: CappedBidRuleQuotaStore,
    validator: CappedBidRuleQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedBidRuleQuotaEngine,
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
      throw new Error(`capped bid rule quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped bid rule quota ${code} not found`);
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
      throw new Error(`capped bid rule quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newCappedBidRuleQuotaCoordinator(store: CappedBidRuleQuotaStore, clockValue: clock.Clock): CappedBidRuleQuotaCoordinator {
  return new CappedBidRuleQuotaCoordinator(
    store,
    defaultCappedBidRuleQuotaValidator(),
    clockValue,
    [],
    defaultCappedBidRuleQuotaEngine(),
  );
}
