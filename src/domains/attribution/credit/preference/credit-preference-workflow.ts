import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditPreferenceEngine, defaultCreditPreferenceEngine } from "./credit-preference-engine.js";
import { CreditPreferenceValidator, defaultCreditPreferenceValidator } from "./credit-preference-rules.js";
import { CreditPreferenceStore } from "./credit-preference-store.js";

/** Moves credit preferences through their life cycle and keeps a journal of what it did. */
export class CreditPreferenceWorkflow {
  store: CreditPreferenceStore;
  validator: CreditPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditPreferenceEngine;

  constructor(
    store: CreditPreferenceStore,
    validator: CreditPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditPreferenceEngine,
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
      throw new Error(`credit preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit preference ${code} not found`);
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

export function newCreditPreferenceWorkflow(store: CreditPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditPreferenceWorkflow {
  return new CreditPreferenceWorkflow(
    store,
    defaultCreditPreferenceValidator(),
    clockValue,
    [],
    defaultCreditPreferenceEngine(flagsValue),
  );
}
