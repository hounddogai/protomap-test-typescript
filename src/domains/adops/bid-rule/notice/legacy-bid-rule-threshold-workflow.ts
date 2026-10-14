import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyBidRuleThresholdEngine,
  defaultLegacyBidRuleThresholdEngine,
} from "./legacy-bid-rule-threshold-engine.js";
import {
  LegacyBidRuleThresholdValidator,
  defaultLegacyBidRuleThresholdValidator,
} from "./legacy-bid-rule-threshold-rules.js";
import { LegacyBidRuleThresholdStore } from "./legacy-bid-rule-threshold-store.js";

/** Moves legacy bid rule thresholds through their life cycle and keeps a journal of what it did. */
export class LegacyBidRuleThresholdDesk {
  store: LegacyBidRuleThresholdStore;
  validator: LegacyBidRuleThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyBidRuleThresholdEngine;

  constructor(
    store: LegacyBidRuleThresholdStore,
    validator: LegacyBidRuleThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyBidRuleThresholdEngine,
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
      throw new Error(`legacy bid rule threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy bid rule threshold ${code} not found`);
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
      throw new Error(`legacy bid rule threshold ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacyBidRuleThresholdDesk(store: LegacyBidRuleThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyBidRuleThresholdDesk {
  return new LegacyBidRuleThresholdDesk(
    store,
    defaultLegacyBidRuleThresholdValidator(),
    clockValue,
    [],
    defaultLegacyBidRuleThresholdEngine(flagsValue),
  );
}
