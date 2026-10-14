import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientBidRuleAdjustmentEngine,
  defaultLenientBidRuleAdjustmentEngine,
} from "./lenient-bid-rule-adjustment-engine.js";
import {
  LenientBidRuleAdjustmentValidator,
  defaultLenientBidRuleAdjustmentValidator,
} from "./lenient-bid-rule-adjustment-rules.js";
import { LenientBidRuleAdjustmentStore } from "./lenient-bid-rule-adjustment-store.js";

/** Moves lenient bid rule adjustments through their life cycle and keeps a journal of what it did. */
export class LenientBidRuleAdjustmentService {
  store: LenientBidRuleAdjustmentStore;
  validator: LenientBidRuleAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientBidRuleAdjustmentEngine;

  constructor(
    store: LenientBidRuleAdjustmentStore,
    validator: LenientBidRuleAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientBidRuleAdjustmentEngine,
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
      throw new Error(`lenient bid rule adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient bid rule adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient bid rule adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientBidRuleAdjustmentService(store: LenientBidRuleAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientBidRuleAdjustmentService {
  return new LenientBidRuleAdjustmentService(
    store,
    defaultLenientBidRuleAdjustmentValidator(),
    clockValue,
    [],
    defaultLenientBidRuleAdjustmentEngine(flagsValue),
  );
}
