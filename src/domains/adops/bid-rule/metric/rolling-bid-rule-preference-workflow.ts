import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingBidRulePreferenceEngine,
  defaultRollingBidRulePreferenceEngine,
} from "./rolling-bid-rule-preference-engine.js";
import {
  RollingBidRulePreferenceValidator,
  defaultRollingBidRulePreferenceValidator,
} from "./rolling-bid-rule-preference-rules.js";
import { RollingBidRulePreferenceStore } from "./rolling-bid-rule-preference-store.js";

/** Moves rolling bid rule preferences through their life cycle and keeps a journal of what it did. */
export class RollingBidRulePreferenceWorkflow {
  store: RollingBidRulePreferenceStore;
  validator: RollingBidRulePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingBidRulePreferenceEngine;

  constructor(
    store: RollingBidRulePreferenceStore,
    validator: RollingBidRulePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingBidRulePreferenceEngine,
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
      throw new Error(`rolling bid rule preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling bid rule preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling bid rule preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRollingBidRulePreferenceWorkflow(store: RollingBidRulePreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingBidRulePreferenceWorkflow {
  return new RollingBidRulePreferenceWorkflow(
    store,
    defaultRollingBidRulePreferenceValidator(),
    clockValue,
    [],
    defaultRollingBidRulePreferenceEngine(flagsValue),
  );
}
