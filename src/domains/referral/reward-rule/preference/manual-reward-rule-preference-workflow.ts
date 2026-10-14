import * as clock from "../../../../kit/clock.js";
import {
  ManualRewardRulePreferenceEngine,
  defaultManualRewardRulePreferenceEngine,
} from "./manual-reward-rule-preference-engine.js";
import {
  ManualRewardRulePreferenceValidator,
  defaultManualRewardRulePreferenceValidator,
} from "./manual-reward-rule-preference-rules.js";
import { ManualRewardRulePreferenceStore } from "./manual-reward-rule-preference-store.js";

/** Moves manual reward rule preferences through their life cycle and keeps a journal of what it did. */
export class ManualRewardRulePreferenceDesk {
  store: ManualRewardRulePreferenceStore;
  validator: ManualRewardRulePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualRewardRulePreferenceEngine;

  constructor(
    store: ManualRewardRulePreferenceStore,
    validator: ManualRewardRulePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualRewardRulePreferenceEngine,
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
      throw new Error(`manual reward rule preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual reward rule preference ${code} not found`);
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
      throw new Error(`manual reward rule preference ${code} not found`);
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

export function newManualRewardRulePreferenceDesk(store: ManualRewardRulePreferenceStore, clockValue: clock.Clock): ManualRewardRulePreferenceDesk {
  return new ManualRewardRulePreferenceDesk(
    store,
    defaultManualRewardRulePreferenceValidator(),
    clockValue,
    [],
    defaultManualRewardRulePreferenceEngine(),
  );
}
