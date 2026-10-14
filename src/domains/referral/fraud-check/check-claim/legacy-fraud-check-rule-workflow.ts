import * as clock from "../../../../kit/clock.js";
import { LegacyFraudCheckRuleEngine, defaultLegacyFraudCheckRuleEngine } from "./legacy-fraud-check-rule-engine.js";
import {
  LegacyFraudCheckRuleValidator,
  defaultLegacyFraudCheckRuleValidator,
} from "./legacy-fraud-check-rule-rules.js";
import { LegacyFraudCheckRuleStore } from "./legacy-fraud-check-rule-store.js";

/** Moves legacy fraud check rules through their life cycle and keeps a journal of what it did. */
export class LegacyFraudCheckRuleDesk {
  store: LegacyFraudCheckRuleStore;
  validator: LegacyFraudCheckRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyFraudCheckRuleEngine;

  constructor(
    store: LegacyFraudCheckRuleStore,
    validator: LegacyFraudCheckRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyFraudCheckRuleEngine,
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
      throw new Error(`legacy fraud check rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy fraud check rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy fraud check rule ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyFraudCheckRuleDesk(store: LegacyFraudCheckRuleStore, clockValue: clock.Clock): LegacyFraudCheckRuleDesk {
  return new LegacyFraudCheckRuleDesk(
    store,
    defaultLegacyFraudCheckRuleValidator(),
    clockValue,
    [],
    defaultLegacyFraudCheckRuleEngine(),
  );
}
