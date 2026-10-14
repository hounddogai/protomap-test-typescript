import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditClaimEngine, defaultCreditClaimEngine } from "./credit-claim-engine.js";
import { CreditClaimValidator, defaultCreditClaimValidator } from "./credit-claim-rules.js";
import { CreditClaimStore } from "./credit-claim-store.js";

/** Moves credit claims through their life cycle and keeps a journal of what it did. */
export class CreditClaimCoordinator {
  store: CreditClaimStore;
  validator: CreditClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditClaimEngine;

  constructor(
    store: CreditClaimStore,
    validator: CreditClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditClaimEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit claim ${code} not found`);
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
      throw new Error(`credit claim ${code} not found`);
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

export function newCreditClaimCoordinator(store: CreditClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditClaimCoordinator {
  return new CreditClaimCoordinator(
    store,
    defaultCreditClaimValidator(),
    clockValue,
    [],
    defaultCreditClaimEngine(flagsValue),
  );
}
