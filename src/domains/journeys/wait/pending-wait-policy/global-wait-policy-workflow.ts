import * as clock from "../../../../kit/clock.js";
import { GlobalWaitPolicyValidator, defaultGlobalWaitPolicyValidator } from "./global-wait-policy-rules.js";
import { GlobalWaitPolicyStore } from "./global-wait-policy-store.js";

/** Moves global wait policies through their life cycle and keeps a journal of what it did. */
export class GlobalWaitPolicyDesk {
  store: GlobalWaitPolicyStore;
  validator: GlobalWaitPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalWaitPolicyStore,
    validator: GlobalWaitPolicyValidator,
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
      throw new Error(`global wait policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global wait policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newGlobalWaitPolicyDesk(store: GlobalWaitPolicyStore, clockValue: clock.Clock): GlobalWaitPolicyDesk {
  return new GlobalWaitPolicyDesk(store, defaultGlobalWaitPolicyValidator(), clockValue, []);
}
