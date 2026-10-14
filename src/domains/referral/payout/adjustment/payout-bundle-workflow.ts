import * as clock from "../../../../kit/clock.js";
import { PayoutBundleValidator, defaultPayoutBundleValidator } from "./payout-bundle-rules.js";
import { PayoutBundleStore } from "./payout-bundle-store.js";

/** Moves payout bundles through their life cycle and keeps a journal of what it did. */
export class PayoutBundleDesk {
  store: PayoutBundleStore;
  validator: PayoutBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PayoutBundleStore,
    validator: PayoutBundleValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newPayoutBundleDesk(store: PayoutBundleStore, clockValue: clock.Clock): PayoutBundleDesk {
  return new PayoutBundleDesk(store, defaultPayoutBundleValidator(), clockValue, []);
}
