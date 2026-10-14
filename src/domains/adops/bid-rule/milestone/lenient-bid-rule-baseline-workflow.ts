import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientBidRuleBaselineEngine,
  defaultLenientBidRuleBaselineEngine,
} from "./lenient-bid-rule-baseline-engine.js";
import {
  LenientBidRuleBaselineValidator,
  defaultLenientBidRuleBaselineValidator,
} from "./lenient-bid-rule-baseline-rules.js";
import { LenientBidRuleBaselineStore } from "./lenient-bid-rule-baseline-store.js";

/** Moves lenient bid rule baselines through their life cycle and keeps a journal of what it did. */
export class LenientBidRuleBaselineService {
  store: LenientBidRuleBaselineStore;
  validator: LenientBidRuleBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientBidRuleBaselineEngine;

  constructor(
    store: LenientBidRuleBaselineStore,
    validator: LenientBidRuleBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientBidRuleBaselineEngine,
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
      throw new Error(`lenient bid rule baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient bid rule baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient bid rule baseline ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLenientBidRuleBaselineService(store: LenientBidRuleBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientBidRuleBaselineService {
  return new LenientBidRuleBaselineService(
    store,
    defaultLenientBidRuleBaselineValidator(),
    clockValue,
    [],
    defaultLenientBidRuleBaselineEngine(flagsValue),
  );
}
