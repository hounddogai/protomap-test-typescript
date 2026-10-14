import * as clock from "../../../../kit/clock.js";
import { DoubleOptInPolicyValidator, defaultDoubleOptInPolicyValidator } from "./double-opt-in-policy-rules.js";
import { DoubleOptInPolicyStore } from "./double-opt-in-policy-store.js";

/** Moves double opt in policies through their life cycle and keeps a journal of what it did. */
export class DoubleOptInPolicyDesk {
  store: DoubleOptInPolicyStore;
  validator: DoubleOptInPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DoubleOptInPolicyStore,
    validator: DoubleOptInPolicyValidator,
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
      throw new Error(`double opt in policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDoubleOptInPolicyDesk(store: DoubleOptInPolicyStore, clockValue: clock.Clock): DoubleOptInPolicyDesk {
  return new DoubleOptInPolicyDesk(store, defaultDoubleOptInPolicyValidator(), clockValue, []);
}
