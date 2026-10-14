import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingBidRuleVarianceEngine,
  defaultPendingBidRuleVarianceEngine,
} from "./pending-bid-rule-variance-engine.js";
import {
  PendingBidRuleVarianceValidator,
  defaultPendingBidRuleVarianceValidator,
} from "./pending-bid-rule-variance-rules.js";
import { PendingBidRuleVarianceStore } from "./pending-bid-rule-variance-store.js";

/** Moves pending bid rule variances through their life cycle and keeps a journal of what it did. */
export class PendingBidRuleVarianceDesk {
  store: PendingBidRuleVarianceStore;
  validator: PendingBidRuleVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBidRuleVarianceEngine;

  constructor(
    store: PendingBidRuleVarianceStore,
    validator: PendingBidRuleVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBidRuleVarianceEngine,
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
      throw new Error(`pending bid rule variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule variance ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPendingBidRuleVarianceDesk(store: PendingBidRuleVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingBidRuleVarianceDesk {
  return new PendingBidRuleVarianceDesk(
    store,
    defaultPendingBidRuleVarianceValidator(),
    clockValue,
    [],
    defaultPendingBidRuleVarianceEngine(flagsValue),
  );
}
