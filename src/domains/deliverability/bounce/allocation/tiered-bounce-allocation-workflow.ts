import * as clock from "../../../../kit/clock.js";
import {
  TieredBounceAllocationValidator,
  defaultTieredBounceAllocationValidator,
} from "./tiered-bounce-allocation-rules.js";
import { TieredBounceAllocationStore } from "./tiered-bounce-allocation-store.js";

/** Moves tiered bounce allocations through their life cycle and keeps a journal of what it did. */
export class TieredBounceAllocationWorkflow {
  store: TieredBounceAllocationStore;
  validator: TieredBounceAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredBounceAllocationStore,
    validator: TieredBounceAllocationValidator,
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
      throw new Error(`tiered bounce allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered bounce allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newTieredBounceAllocationWorkflow(store: TieredBounceAllocationStore, clockValue: clock.Clock): TieredBounceAllocationWorkflow {
  return new TieredBounceAllocationWorkflow(store, defaultTieredBounceAllocationValidator(), clockValue, []);
}
