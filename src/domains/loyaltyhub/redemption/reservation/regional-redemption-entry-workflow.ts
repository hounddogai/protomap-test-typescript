import * as clock from "../../../../kit/clock.js";
import {
  RegionalRedemptionEntryValidator,
  defaultRegionalRedemptionEntryValidator,
} from "./regional-redemption-entry-rules.js";
import { RegionalRedemptionEntryStore } from "./regional-redemption-entry-store.js";

/** Moves regional redemption entries through their life cycle and keeps a journal of what it did. */
export class RegionalRedemptionEntryManager {
  store: RegionalRedemptionEntryStore;
  validator: RegionalRedemptionEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalRedemptionEntryStore,
    validator: RegionalRedemptionEntryValidator,
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
      throw new Error(`regional redemption entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional redemption entry ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalRedemptionEntryManager(store: RegionalRedemptionEntryStore, clockValue: clock.Clock): RegionalRedemptionEntryManager {
  return new RegionalRedemptionEntryManager(store, defaultRegionalRedemptionEntryValidator(), clockValue, []);
}
