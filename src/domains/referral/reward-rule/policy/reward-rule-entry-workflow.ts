import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleEntryEngine, defaultRewardRuleEntryEngine } from "./reward-rule-entry-engine.js";
import { RewardRuleEntryValidator, defaultRewardRuleEntryValidator } from "./reward-rule-entry-rules.js";
import { RewardRuleEntryStore } from "./reward-rule-entry-store.js";

/** Moves reward rule entries through their life cycle and keeps a journal of what it did. */
export class RewardRuleEntryService {
  store: RewardRuleEntryStore;
  validator: RewardRuleEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleEntryEngine;

  constructor(
    store: RewardRuleEntryStore,
    validator: RewardRuleEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleEntryEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule entry ${code} not found`);
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

export function newRewardRuleEntryService(store: RewardRuleEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleEntryService {
  return new RewardRuleEntryService(
    store,
    defaultRewardRuleEntryValidator(),
    clockValue,
    [],
    defaultRewardRuleEntryEngine(flagsValue),
  );
}
