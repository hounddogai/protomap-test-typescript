import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  StrictRewardRulePreferenceEngine,
  defaultStrictRewardRulePreferenceEngine,
} from "./strict-reward-rule-preference-engine.js";
import {
  StrictRewardRulePreferenceValidator,
  defaultStrictRewardRulePreferenceValidator,
} from "./strict-reward-rule-preference-rules.js";
import { StrictRewardRulePreferenceStore } from "./strict-reward-rule-preference-store.js";

/** Moves strict reward rule preferences through their life cycle and keeps a journal of what it did. */
export class StrictRewardRulePreferenceCoordinator {
  store: StrictRewardRulePreferenceStore;
  validator: StrictRewardRulePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictRewardRulePreferenceEngine;

  constructor(
    store: StrictRewardRulePreferenceStore,
    validator: StrictRewardRulePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictRewardRulePreferenceEngine,
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
      throw new Error(`strict reward rule preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reward rule preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reward rule preference ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictRewardRulePreferenceCoordinator(store: StrictRewardRulePreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictRewardRulePreferenceCoordinator {
  return new StrictRewardRulePreferenceCoordinator(
    store,
    defaultStrictRewardRulePreferenceValidator(),
    clockValue,
    [],
    defaultStrictRewardRulePreferenceEngine(flagsValue),
  );
}
