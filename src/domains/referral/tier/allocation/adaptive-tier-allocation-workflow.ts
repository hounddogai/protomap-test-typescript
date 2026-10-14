import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveTierAllocationValidator,
  defaultAdaptiveTierAllocationValidator,
} from "./adaptive-tier-allocation-rules.js";
import { AdaptiveTierAllocationStore } from "./adaptive-tier-allocation-store.js";

/** Moves adaptive tier allocations through their life cycle and keeps a journal of what it did. */
export class AdaptiveTierAllocationManager {
  store: AdaptiveTierAllocationStore;
  validator: AdaptiveTierAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveTierAllocationStore,
    validator: AdaptiveTierAllocationValidator,
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
      throw new Error(`adaptive tier allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive tier allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveTierAllocationManager(store: AdaptiveTierAllocationStore, clockValue: clock.Clock): AdaptiveTierAllocationManager {
  return new AdaptiveTierAllocationManager(store, defaultAdaptiveTierAllocationValidator(), clockValue, []);
}
