import * as clock from "../../../../kit/clock.js";
import { LenientPaywallEntryValidator, defaultLenientPaywallEntryValidator } from "./lenient-paywall-entry-rules.js";
import { LenientPaywallEntryStore } from "./lenient-paywall-entry-store.js";

/** Moves lenient paywall entries through their life cycle and keeps a journal of what it did. */
export class LenientPaywallEntryDesk {
  store: LenientPaywallEntryStore;
  validator: LenientPaywallEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientPaywallEntryStore,
    validator: LenientPaywallEntryValidator,
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
      throw new Error(`lenient paywall entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient paywall entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newLenientPaywallEntryDesk(store: LenientPaywallEntryStore, clockValue: clock.Clock): LenientPaywallEntryDesk {
  return new LenientPaywallEntryDesk(store, defaultLenientPaywallEntryValidator(), clockValue, []);
}
