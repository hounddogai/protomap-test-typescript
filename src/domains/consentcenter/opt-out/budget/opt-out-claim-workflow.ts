import * as clock from "../../../../kit/clock.js";
import { OptOutClaimValidator, defaultOptOutClaimValidator } from "./opt-out-claim-rules.js";
import { OptOutClaimStore } from "./opt-out-claim-store.js";

/** Moves opt out claims through their life cycle and keeps a journal of what it did. */
export class OptOutClaimDesk {
  store: OptOutClaimStore;
  validator: OptOutClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: OptOutClaimStore,
    validator: OptOutClaimValidator,
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
      throw new Error(`opt out claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out claim ${code} not found`);
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
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newOptOutClaimDesk(store: OptOutClaimStore, clockValue: clock.Clock): OptOutClaimDesk {
  return new OptOutClaimDesk(store, defaultOptOutClaimValidator(), clockValue, []);
}
