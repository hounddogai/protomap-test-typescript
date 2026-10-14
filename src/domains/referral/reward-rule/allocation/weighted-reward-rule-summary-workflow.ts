import * as clock from "../../../../kit/clock.js";
import {
  WeightedRewardRuleSummaryEngine,
  defaultWeightedRewardRuleSummaryEngine,
} from "./weighted-reward-rule-summary-engine.js";
import {
  WeightedRewardRuleSummaryValidator,
  defaultWeightedRewardRuleSummaryValidator,
} from "./weighted-reward-rule-summary-rules.js";
import { WeightedRewardRuleSummaryStore } from "./weighted-reward-rule-summary-store.js";

/** Moves weighted reward rule summaries through their life cycle and keeps a journal of what it did. */
export class WeightedRewardRuleSummaryManager {
  store: WeightedRewardRuleSummaryStore;
  validator: WeightedRewardRuleSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedRewardRuleSummaryEngine;

  constructor(
    store: WeightedRewardRuleSummaryStore,
    validator: WeightedRewardRuleSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedRewardRuleSummaryEngine,
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
      throw new Error(`weighted reward rule summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward rule summary ${code} not found`);
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
      throw new Error(`weighted reward rule summary ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWeightedRewardRuleSummaryManager(store: WeightedRewardRuleSummaryStore, clockValue: clock.Clock): WeightedRewardRuleSummaryManager {
  return new WeightedRewardRuleSummaryManager(
    store,
    defaultWeightedRewardRuleSummaryValidator(),
    clockValue,
    [],
    defaultWeightedRewardRuleSummaryEngine(),
  );
}
