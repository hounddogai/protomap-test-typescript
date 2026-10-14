import * as clock from "../../../../kit/clock.js";
import { CreditPolicyValidator, defaultCreditPolicyValidator } from "./credit-policy-rules.js";
import { CreditPolicyStore } from "./credit-policy-store.js";

/** Moves credit policies through their life cycle and keeps a journal of what it did. */
export class CreditPolicyCoordinator {
  store: CreditPolicyStore;
  validator: CreditPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CreditPolicyStore,
    validator: CreditPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newCreditPolicyCoordinator(store: CreditPolicyStore, clockValue: clock.Clock): CreditPolicyCoordinator {
  return new CreditPolicyCoordinator(store, defaultCreditPolicyValidator(), clockValue, []);
}
