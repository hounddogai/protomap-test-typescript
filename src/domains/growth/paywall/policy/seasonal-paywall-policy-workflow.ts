import * as clock from "../../../../kit/clock.js";
import {
  SeasonalPaywallPolicyValidator,
  defaultSeasonalPaywallPolicyValidator,
} from "./seasonal-paywall-policy-rules.js";
import { SeasonalPaywallPolicyStore } from "./seasonal-paywall-policy-store.js";

/** Moves seasonal paywall policies through their life cycle and keeps a journal of what it did. */
export class SeasonalPaywallPolicyWorkflow {
  store: SeasonalPaywallPolicyStore;
  validator: SeasonalPaywallPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalPaywallPolicyStore,
    validator: SeasonalPaywallPolicyValidator,
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
      throw new Error(`seasonal paywall policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal paywall policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newSeasonalPaywallPolicyWorkflow(store: SeasonalPaywallPolicyStore, clockValue: clock.Clock): SeasonalPaywallPolicyWorkflow {
  return new SeasonalPaywallPolicyWorkflow(store, defaultSeasonalPaywallPolicyValidator(), clockValue, []);
}
