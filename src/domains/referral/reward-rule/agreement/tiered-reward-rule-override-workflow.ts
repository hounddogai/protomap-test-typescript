import * as clock from "../../../../kit/clock.js";
import {
  TieredRewardRuleOverrideEngine,
  defaultTieredRewardRuleOverrideEngine,
} from "./tiered-reward-rule-override-engine.js";
import {
  TieredRewardRuleOverrideValidator,
  defaultTieredRewardRuleOverrideValidator,
} from "./tiered-reward-rule-override-rules.js";
import { TieredRewardRuleOverrideStore } from "./tiered-reward-rule-override-store.js";

/** Moves tiered reward rule overrides through their life cycle and keeps a journal of what it did. */
export class TieredRewardRuleOverrideCoordinator {
  store: TieredRewardRuleOverrideStore;
  validator: TieredRewardRuleOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredRewardRuleOverrideEngine;

  constructor(
    store: TieredRewardRuleOverrideStore,
    validator: TieredRewardRuleOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredRewardRuleOverrideEngine,
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
      throw new Error(`tiered reward rule override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward rule override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward rule override ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newTieredRewardRuleOverrideCoordinator(store: TieredRewardRuleOverrideStore, clockValue: clock.Clock): TieredRewardRuleOverrideCoordinator {
  return new TieredRewardRuleOverrideCoordinator(
    store,
    defaultTieredRewardRuleOverrideValidator(),
    clockValue,
    [],
    defaultTieredRewardRuleOverrideEngine(),
  );
}
