import * as clock from "../../../../kit/clock.js";
import {
  StrictRedemptionPolicyValidator,
  defaultStrictRedemptionPolicyValidator,
} from "./strict-redemption-policy-rules.js";
import { StrictRedemptionPolicyStore } from "./strict-redemption-policy-store.js";

/** Moves strict redemption policies through their life cycle and keeps a journal of what it did. */
export class StrictRedemptionPolicyDesk {
  store: StrictRedemptionPolicyStore;
  validator: StrictRedemptionPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictRedemptionPolicyStore,
    validator: StrictRedemptionPolicyValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict redemption policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict redemption policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictRedemptionPolicyDesk(store: StrictRedemptionPolicyStore, clockValue: clock.Clock): StrictRedemptionPolicyDesk {
  return new StrictRedemptionPolicyDesk(store, defaultStrictRedemptionPolicyValidator(), clockValue, []);
}
