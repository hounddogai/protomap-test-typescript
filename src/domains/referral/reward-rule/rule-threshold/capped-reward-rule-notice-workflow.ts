import * as clock from "../../../../kit/clock.js";
import {
  CappedRewardRuleNoticeEngine,
  defaultCappedRewardRuleNoticeEngine,
} from "./capped-reward-rule-notice-engine.js";
import {
  CappedRewardRuleNoticeValidator,
  defaultCappedRewardRuleNoticeValidator,
} from "./capped-reward-rule-notice-rules.js";
import { CappedRewardRuleNoticeStore } from "./capped-reward-rule-notice-store.js";

/** Moves capped reward rule notices through their life cycle and keeps a journal of what it did. */
export class CappedRewardRuleNoticeWorkflow {
  store: CappedRewardRuleNoticeStore;
  validator: CappedRewardRuleNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedRewardRuleNoticeEngine;

  constructor(
    store: CappedRewardRuleNoticeStore,
    validator: CappedRewardRuleNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedRewardRuleNoticeEngine,
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
      throw new Error(`capped reward rule notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reward rule notice ${code} not found`);
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
      throw new Error(`capped reward rule notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newCappedRewardRuleNoticeWorkflow(store: CappedRewardRuleNoticeStore, clockValue: clock.Clock): CappedRewardRuleNoticeWorkflow {
  return new CappedRewardRuleNoticeWorkflow(
    store,
    defaultCappedRewardRuleNoticeValidator(),
    clockValue,
    [],
    defaultCappedRewardRuleNoticeEngine(),
  );
}
