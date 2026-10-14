import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualRewardRuleAdjustmentEngine,
  defaultManualRewardRuleAdjustmentEngine,
} from "./manual-reward-rule-adjustment-engine.js";
import {
  ManualRewardRuleAdjustmentValidator,
  defaultManualRewardRuleAdjustmentValidator,
} from "./manual-reward-rule-adjustment-rules.js";
import { ManualRewardRuleAdjustmentStore } from "./manual-reward-rule-adjustment-store.js";

/** Moves manual reward rule adjustments through their life cycle and keeps a journal of what it did. */
export class ManualRewardRuleAdjustmentService {
  store: ManualRewardRuleAdjustmentStore;
  validator: ManualRewardRuleAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualRewardRuleAdjustmentEngine;

  constructor(
    store: ManualRewardRuleAdjustmentStore,
    validator: ManualRewardRuleAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualRewardRuleAdjustmentEngine,
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
      throw new Error(`manual reward rule adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual reward rule adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual reward rule adjustment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newManualRewardRuleAdjustmentService(store: ManualRewardRuleAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualRewardRuleAdjustmentService {
  return new ManualRewardRuleAdjustmentService(
    store,
    defaultManualRewardRuleAdjustmentValidator(),
    clockValue,
    [],
    defaultManualRewardRuleAdjustmentEngine(flagsValue),
  );
}
