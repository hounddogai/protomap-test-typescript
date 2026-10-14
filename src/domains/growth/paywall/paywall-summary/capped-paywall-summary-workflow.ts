import * as clock from "../../../../kit/clock.js";
import {
  CappedPaywallSummaryValidator,
  defaultCappedPaywallSummaryValidator,
} from "./capped-paywall-summary-rules.js";
import { CappedPaywallSummaryStore } from "./capped-paywall-summary-store.js";

/** Moves capped paywall summaries through their life cycle and keeps a journal of what it did. */
export class CappedPaywallSummaryManager {
  store: CappedPaywallSummaryStore;
  validator: CappedPaywallSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedPaywallSummaryStore,
    validator: CappedPaywallSummaryValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped paywall summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped paywall summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newCappedPaywallSummaryManager(store: CappedPaywallSummaryStore, clockValue: clock.Clock): CappedPaywallSummaryManager {
  return new CappedPaywallSummaryManager(store, defaultCappedPaywallSummaryValidator(), clockValue, []);
}
