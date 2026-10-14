import * as clock from "../../../../kit/clock.js";
import { CappedPaywallMetricValidator, defaultCappedPaywallMetricValidator } from "./capped-paywall-metric-rules.js";
import { CappedPaywallMetricStore } from "./capped-paywall-metric-store.js";

/** Moves capped paywall metrics through their life cycle and keeps a journal of what it did. */
export class CappedPaywallMetricDesk {
  store: CappedPaywallMetricStore;
  validator: CappedPaywallMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedPaywallMetricStore,
    validator: CappedPaywallMetricValidator,
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
      throw new Error(`capped paywall metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped paywall metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newCappedPaywallMetricDesk(store: CappedPaywallMetricStore, clockValue: clock.Clock): CappedPaywallMetricDesk {
  return new CappedPaywallMetricDesk(store, defaultCappedPaywallMetricValidator(), clockValue, []);
}
