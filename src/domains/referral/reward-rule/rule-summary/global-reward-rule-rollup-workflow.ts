import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalRewardRuleRollupEngine,
  defaultGlobalRewardRuleRollupEngine,
} from "./global-reward-rule-rollup-engine.js";
import {
  GlobalRewardRuleRollupValidator,
  defaultGlobalRewardRuleRollupValidator,
} from "./global-reward-rule-rollup-rules.js";
import { GlobalRewardRuleRollupStore } from "./global-reward-rule-rollup-store.js";

/** Moves global reward rule rollups through their life cycle and keeps a journal of what it did. */
export class GlobalRewardRuleRollupDesk {
  store: GlobalRewardRuleRollupStore;
  validator: GlobalRewardRuleRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalRewardRuleRollupEngine;

  constructor(
    store: GlobalRewardRuleRollupStore,
    validator: GlobalRewardRuleRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalRewardRuleRollupEngine,
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
      throw new Error(`global reward rule rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global reward rule rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global reward rule rollup ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newGlobalRewardRuleRollupDesk(store: GlobalRewardRuleRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalRewardRuleRollupDesk {
  return new GlobalRewardRuleRollupDesk(
    store,
    defaultGlobalRewardRuleRollupValidator(),
    clockValue,
    [],
    defaultGlobalRewardRuleRollupEngine(flagsValue),
  );
}
