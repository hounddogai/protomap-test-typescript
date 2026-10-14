import * as clock from "../../../../kit/clock.js";
import { CreditBundleValidator, defaultCreditBundleValidator } from "./credit-bundle-rules.js";
import { CreditBundleStore } from "./credit-bundle-store.js";

/** Moves credit bundles through their life cycle and keeps a journal of what it did. */
export class CreditBundleService {
  store: CreditBundleStore;
  validator: CreditBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CreditBundleStore,
    validator: CreditBundleValidator,
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
      throw new Error(`credit bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newCreditBundleService(store: CreditBundleStore, clockValue: clock.Clock): CreditBundleService {
  return new CreditBundleService(store, defaultCreditBundleValidator(), clockValue, []);
}
