import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveReplyBudgetEngine, defaultAdaptiveReplyBudgetEngine } from "./adaptive-reply-budget-engine.js";
import { AdaptiveReplyBudgetValidator, defaultAdaptiveReplyBudgetValidator } from "./adaptive-reply-budget-rules.js";
import { AdaptiveReplyBudgetStore } from "./adaptive-reply-budget-store.js";

/** Moves adaptive reply budgets through their life cycle and keeps a journal of what it did. */
export class AdaptiveReplyBudgetCoordinator {
  store: AdaptiveReplyBudgetStore;
  validator: AdaptiveReplyBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveReplyBudgetEngine;

  constructor(
    store: AdaptiveReplyBudgetStore,
    validator: AdaptiveReplyBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveReplyBudgetEngine,
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
      throw new Error(`adaptive reply budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive reply budget ${code} not found`);
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
      throw new Error(`adaptive reply budget ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newAdaptiveReplyBudgetCoordinator(store: AdaptiveReplyBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveReplyBudgetCoordinator {
  return new AdaptiveReplyBudgetCoordinator(
    store,
    defaultAdaptiveReplyBudgetValidator(),
    clockValue,
    [],
    defaultAdaptiveReplyBudgetEngine(flagsValue),
  );
}
