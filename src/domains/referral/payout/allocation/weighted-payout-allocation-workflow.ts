import * as clock from "../../../../kit/clock.js";
import {
  WeightedPayoutAllocationValidator,
  defaultWeightedPayoutAllocationValidator,
} from "./weighted-payout-allocation-rules.js";
import { WeightedPayoutAllocationStore } from "./weighted-payout-allocation-store.js";

/** Moves weighted payout allocations through their life cycle and keeps a journal of what it did. */
export class WeightedPayoutAllocationManager {
  store: WeightedPayoutAllocationStore;
  validator: WeightedPayoutAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedPayoutAllocationStore,
    validator: WeightedPayoutAllocationValidator,
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
      throw new Error(`weighted payout allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted payout allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newWeightedPayoutAllocationManager(store: WeightedPayoutAllocationStore, clockValue: clock.Clock): WeightedPayoutAllocationManager {
  return new WeightedPayoutAllocationManager(store, defaultWeightedPayoutAllocationValidator(), clockValue, []);
}
