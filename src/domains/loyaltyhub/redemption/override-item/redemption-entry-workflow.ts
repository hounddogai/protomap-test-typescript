import * as clock from "../../../../kit/clock.js";
import { RedemptionEntryValidator, defaultRedemptionEntryValidator } from "./redemption-entry-rules.js";
import { RedemptionEntryStore } from "./redemption-entry-store.js";

/** Moves redemption entries through their life cycle and keeps a journal of what it did. */
export class RedemptionEntryDesk {
  store: RedemptionEntryStore;
  validator: RedemptionEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RedemptionEntryStore,
    validator: RedemptionEntryValidator,
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
      throw new Error(`redemption entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newRedemptionEntryDesk(store: RedemptionEntryStore, clockValue: clock.Clock): RedemptionEntryDesk {
  return new RedemptionEntryDesk(store, defaultRedemptionEntryValidator(), clockValue, []);
}
