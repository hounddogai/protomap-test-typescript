import * as clock from "../../../../kit/clock.js";
import {
  RedemptionAllocationValidator,
  defaultRedemptionAllocationValidator,
} from "./redemption-allocation-rules.js";
import { RedemptionAllocationStore } from "./redemption-allocation-store.js";

/** Moves redemption allocations through their life cycle and keeps a journal of what it did. */
export class RedemptionAllocationCoordinator {
  store: RedemptionAllocationStore;
  validator: RedemptionAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RedemptionAllocationStore,
    validator: RedemptionAllocationValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newRedemptionAllocationCoordinator(store: RedemptionAllocationStore, clockValue: clock.Clock): RedemptionAllocationCoordinator {
  return new RedemptionAllocationCoordinator(store, defaultRedemptionAllocationValidator(), clockValue, []);
}
