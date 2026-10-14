import * as clock from "../../../../kit/clock.js";
import { PayoutPreferenceValidator, defaultPayoutPreferenceValidator } from "./payout-preference-rules.js";
import { PayoutPreferenceStore } from "./payout-preference-store.js";

/** Moves payout preferences through their life cycle and keeps a journal of what it did. */
export class PayoutPreferenceService {
  store: PayoutPreferenceStore;
  validator: PayoutPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PayoutPreferenceStore,
    validator: PayoutPreferenceValidator,
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
      throw new Error(`payout preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout preference ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPayoutPreferenceService(store: PayoutPreferenceStore, clockValue: clock.Clock): PayoutPreferenceService {
  return new PayoutPreferenceService(store, defaultPayoutPreferenceValidator(), clockValue, []);
}
