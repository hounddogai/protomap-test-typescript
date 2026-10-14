import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleSummaryEngine, defaultRewardRuleSummaryEngine } from "./reward-rule-summary-engine.js";
import { RewardRuleSummaryValidator, defaultRewardRuleSummaryValidator } from "./reward-rule-summary-rules.js";
import { RewardRuleSummaryStore } from "./reward-rule-summary-store.js";

/** Moves reward rule summaries through their life cycle and keeps a journal of what it did. */
export class RewardRuleSummaryManager {
  store: RewardRuleSummaryStore;
  validator: RewardRuleSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleSummaryEngine;

  constructor(
    store: RewardRuleSummaryStore,
    validator: RewardRuleSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleSummaryEngine,
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
      throw new Error(`reward rule summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule summary ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRewardRuleSummaryManager(store: RewardRuleSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleSummaryManager {
  return new RewardRuleSummaryManager(
    store,
    defaultRewardRuleSummaryValidator(),
    clockValue,
    [],
    defaultRewardRuleSummaryEngine(flagsValue),
  );
}
