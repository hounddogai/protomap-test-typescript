import * as clock from "../../../../kit/clock.js";
import { RedemptionRequestValidator, defaultRedemptionRequestValidator } from "./redemption-request-rules.js";
import { RedemptionRequestStore } from "./redemption-request-store.js";

/** Moves redemption requests through their life cycle and keeps a journal of what it did. */
export class RedemptionRequestDesk {
  store: RedemptionRequestStore;
  validator: RedemptionRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RedemptionRequestStore,
    validator: RedemptionRequestValidator,
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
      throw new Error(`redemption request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newRedemptionRequestDesk(store: RedemptionRequestStore, clockValue: clock.Clock): RedemptionRequestDesk {
  return new RedemptionRequestDesk(store, defaultRedemptionRequestValidator(), clockValue, []);
}
