import * as clock from "../../../../kit/clock.js";
import { BounceQuotaValidator, defaultBounceQuotaValidator } from "./bounce-quota-rules.js";
import { BounceQuotaStore } from "./bounce-quota-store.js";

/** Moves bounce quotas through their life cycle and keeps a journal of what it did. */
export class BounceQuotaManager {
  store: BounceQuotaStore;
  validator: BounceQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BounceQuotaStore,
    validator: BounceQuotaValidator,
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
      throw new Error(`bounce quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newBounceQuotaManager(store: BounceQuotaStore, clockValue: clock.Clock): BounceQuotaManager {
  return new BounceQuotaManager(store, defaultBounceQuotaValidator(), clockValue, []);
}
