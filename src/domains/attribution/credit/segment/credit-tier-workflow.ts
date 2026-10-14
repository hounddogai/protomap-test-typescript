import * as clock from "../../../../kit/clock.js";
import { CreditTierEngine, defaultCreditTierEngine } from "./credit-tier-engine.js";
import { CreditTierValidator, defaultCreditTierValidator } from "./credit-tier-rules.js";
import { CreditTierStore } from "./credit-tier-store.js";

/** Moves credit tiers through their life cycle and keeps a journal of what it did. */
export class CreditTierDesk {
  store: CreditTierStore;
  validator: CreditTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditTierEngine;

  constructor(
    store: CreditTierStore,
    validator: CreditTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditTierEngine,
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
      throw new Error(`credit tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit tier ${code} not found`);
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

export function newCreditTierDesk(store: CreditTierStore, clockValue: clock.Clock): CreditTierDesk {
  return new CreditTierDesk(store, defaultCreditTierValidator(), clockValue, [], defaultCreditTierEngine());
}
