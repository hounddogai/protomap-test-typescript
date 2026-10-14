import * as clock from "../../../../kit/clock.js";
import { PrimaryWaitPolicyValidator, defaultPrimaryWaitPolicyValidator } from "./primary-wait-policy-rules.js";
import { PrimaryWaitPolicyStore } from "./primary-wait-policy-store.js";

/** Moves primary wait policies through their life cycle and keeps a journal of what it did. */
export class PrimaryWaitPolicyCoordinator {
  store: PrimaryWaitPolicyStore;
  validator: PrimaryWaitPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryWaitPolicyStore,
    validator: PrimaryWaitPolicyValidator,
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
      throw new Error(`primary wait policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary wait policy ${code} not found`);
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

export function newPrimaryWaitPolicyCoordinator(store: PrimaryWaitPolicyStore, clockValue: clock.Clock): PrimaryWaitPolicyCoordinator {
  return new PrimaryWaitPolicyCoordinator(store, defaultPrimaryWaitPolicyValidator(), clockValue, []);
}
