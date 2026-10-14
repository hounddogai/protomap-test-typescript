import * as clock from "../../../../kit/clock.js";
import { RedemptionTierValidator, defaultRedemptionTierValidator } from "./redemption-tier-rules.js";
import { RedemptionTierStore } from "./redemption-tier-store.js";

/** Moves redemption tiers through their life cycle and keeps a journal of what it did. */
export class RedemptionTierService {
  store: RedemptionTierStore;
  validator: RedemptionTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RedemptionTierStore,
    validator: RedemptionTierValidator,
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
      throw new Error(`redemption tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRedemptionTierService(store: RedemptionTierStore, clockValue: clock.Clock): RedemptionTierService {
  return new RedemptionTierService(store, defaultRedemptionTierValidator(), clockValue, []);
}
