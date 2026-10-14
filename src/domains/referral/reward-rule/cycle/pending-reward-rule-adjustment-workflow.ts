import * as clock from "../../../../kit/clock.js";
import {
  PendingRewardRuleAdjustmentEngine,
  defaultPendingRewardRuleAdjustmentEngine,
} from "./pending-reward-rule-adjustment-engine.js";
import {
  PendingRewardRuleAdjustmentValidator,
  defaultPendingRewardRuleAdjustmentValidator,
} from "./pending-reward-rule-adjustment-rules.js";
import { PendingRewardRuleAdjustmentStore } from "./pending-reward-rule-adjustment-store.js";

/** Moves pending reward rule adjustments through their life cycle and keeps a journal of what it did. */
export class PendingRewardRuleAdjustmentManager {
  store: PendingRewardRuleAdjustmentStore;
  validator: PendingRewardRuleAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingRewardRuleAdjustmentEngine;

  constructor(
    store: PendingRewardRuleAdjustmentStore,
    validator: PendingRewardRuleAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingRewardRuleAdjustmentEngine,
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
      throw new Error(`pending reward rule adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending reward rule adjustment ${code} not found`);
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
      throw new Error(`pending reward rule adjustment ${code} not found`);
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

export function newPendingRewardRuleAdjustmentManager(store: PendingRewardRuleAdjustmentStore, clockValue: clock.Clock): PendingRewardRuleAdjustmentManager {
  return new PendingRewardRuleAdjustmentManager(
    store,
    defaultPendingRewardRuleAdjustmentValidator(),
    clockValue,
    [],
    defaultPendingRewardRuleAdjustmentEngine(),
  );
}
