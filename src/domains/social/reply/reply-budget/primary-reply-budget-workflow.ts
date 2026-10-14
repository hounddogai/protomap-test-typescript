import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryReplyBudgetEngine, defaultPrimaryReplyBudgetEngine } from "./primary-reply-budget-engine.js";
import { PrimaryReplyBudgetValidator, defaultPrimaryReplyBudgetValidator } from "./primary-reply-budget-rules.js";
import { PrimaryReplyBudgetStore } from "./primary-reply-budget-store.js";

/** Moves primary reply budgets through their life cycle and keeps a journal of what it did. */
export class PrimaryReplyBudgetCoordinator {
  store: PrimaryReplyBudgetStore;
  validator: PrimaryReplyBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryReplyBudgetEngine;

  constructor(
    store: PrimaryReplyBudgetStore,
    validator: PrimaryReplyBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryReplyBudgetEngine,
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
      throw new Error(`primary reply budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reply budget ${code} not found`);
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
      throw new Error(`primary reply budget ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryReplyBudgetCoordinator(store: PrimaryReplyBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryReplyBudgetCoordinator {
  return new PrimaryReplyBudgetCoordinator(
    store,
    defaultPrimaryReplyBudgetValidator(),
    clockValue,
    [],
    defaultPrimaryReplyBudgetEngine(flagsValue),
  );
}
