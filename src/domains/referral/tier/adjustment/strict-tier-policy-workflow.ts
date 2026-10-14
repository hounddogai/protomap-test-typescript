import * as clock from "../../../../kit/clock.js";
import { StrictTierPolicyValidator, defaultStrictTierPolicyValidator } from "./strict-tier-policy-rules.js";
import { StrictTierPolicyStore } from "./strict-tier-policy-store.js";

/** Moves strict tier policies through their life cycle and keeps a journal of what it did. */
export class StrictTierPolicyCoordinator {
  store: StrictTierPolicyStore;
  validator: StrictTierPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictTierPolicyStore,
    validator: StrictTierPolicyValidator,
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
      throw new Error(`strict tier policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict tier policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newStrictTierPolicyCoordinator(store: StrictTierPolicyStore, clockValue: clock.Clock): StrictTierPolicyCoordinator {
  return new StrictTierPolicyCoordinator(store, defaultStrictTierPolicyValidator(), clockValue, []);
}
