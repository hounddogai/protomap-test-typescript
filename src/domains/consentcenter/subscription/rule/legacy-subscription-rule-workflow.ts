import * as clock from "../../../../kit/clock.js";
import {
  LegacySubscriptionRuleEngine,
  defaultLegacySubscriptionRuleEngine,
} from "./legacy-subscription-rule-engine.js";
import {
  LegacySubscriptionRuleValidator,
  defaultLegacySubscriptionRuleValidator,
} from "./legacy-subscription-rule-rules.js";
import { LegacySubscriptionRuleStore } from "./legacy-subscription-rule-store.js";

/** Moves legacy subscription rules through their life cycle and keeps a journal of what it did. */
export class LegacySubscriptionRuleService {
  store: LegacySubscriptionRuleStore;
  validator: LegacySubscriptionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacySubscriptionRuleEngine;

  constructor(
    store: LegacySubscriptionRuleStore,
    validator: LegacySubscriptionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacySubscriptionRuleEngine,
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
      throw new Error(`legacy subscription rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy subscription rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy subscription rule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacySubscriptionRuleService(store: LegacySubscriptionRuleStore, clockValue: clock.Clock): LegacySubscriptionRuleService {
  return new LegacySubscriptionRuleService(
    store,
    defaultLegacySubscriptionRuleValidator(),
    clockValue,
    [],
    defaultLegacySubscriptionRuleEngine(),
  );
}
