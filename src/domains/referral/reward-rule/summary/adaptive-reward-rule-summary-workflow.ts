import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveRewardRuleSummaryEngine,
  defaultAdaptiveRewardRuleSummaryEngine,
} from "./adaptive-reward-rule-summary-engine.js";
import {
  AdaptiveRewardRuleSummaryValidator,
  defaultAdaptiveRewardRuleSummaryValidator,
} from "./adaptive-reward-rule-summary-rules.js";
import { AdaptiveRewardRuleSummaryStore } from "./adaptive-reward-rule-summary-store.js";

/** Moves adaptive reward rule summaries through their life cycle and keeps a journal of what it did. */
export class AdaptiveRewardRuleSummaryDesk {
  store: AdaptiveRewardRuleSummaryStore;
  validator: AdaptiveRewardRuleSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveRewardRuleSummaryEngine;

  constructor(
    store: AdaptiveRewardRuleSummaryStore,
    validator: AdaptiveRewardRuleSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveRewardRuleSummaryEngine,
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
      throw new Error(`adaptive reward rule summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive reward rule summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive reward rule summary ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newAdaptiveRewardRuleSummaryDesk(store: AdaptiveRewardRuleSummaryStore, clockValue: clock.Clock): AdaptiveRewardRuleSummaryDesk {
  return new AdaptiveRewardRuleSummaryDesk(
    store,
    defaultAdaptiveRewardRuleSummaryValidator(),
    clockValue,
    [],
    defaultAdaptiveRewardRuleSummaryEngine(),
  );
}
