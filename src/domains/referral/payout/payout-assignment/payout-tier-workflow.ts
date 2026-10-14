import * as clock from "../../../../kit/clock.js";
import { PayoutTierValidator, defaultPayoutTierValidator } from "./payout-tier-rules.js";
import { PayoutTierStore } from "./payout-tier-store.js";

/** Moves payout tiers through their life cycle and keeps a journal of what it did. */
export class PayoutTierCoordinator {
  store: PayoutTierStore;
  validator: PayoutTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: PayoutTierStore, validator: PayoutTierValidator, clockValue: clock.Clock, journal: string[]) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newPayoutTierCoordinator(store: PayoutTierStore, clockValue: clock.Clock): PayoutTierCoordinator {
  return new PayoutTierCoordinator(store, defaultPayoutTierValidator(), clockValue, []);
}
