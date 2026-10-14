import * as clock from "../../../../kit/clock.js";
import { CreditAgreementEngine, defaultCreditAgreementEngine } from "./credit-agreement-engine.js";
import { CreditAgreementValidator, defaultCreditAgreementValidator } from "./credit-agreement-rules.js";
import { CreditAgreementStore } from "./credit-agreement-store.js";

/** Moves credit agreements through their life cycle and keeps a journal of what it did. */
export class CreditAgreementDesk {
  store: CreditAgreementStore;
  validator: CreditAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditAgreementEngine;

  constructor(
    store: CreditAgreementStore,
    validator: CreditAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditAgreementEngine,
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
      throw new Error(`credit agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit agreement ${code} not found`);
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

export function newCreditAgreementDesk(store: CreditAgreementStore, clockValue: clock.Clock): CreditAgreementDesk {
  return new CreditAgreementDesk(
    store,
    defaultCreditAgreementValidator(),
    clockValue,
    [],
    defaultCreditAgreementEngine(),
  );
}
