import * as clock from "../../../../kit/clock.js";
import {
  PendingApprovalAllocationValidator,
  defaultPendingApprovalAllocationValidator,
} from "./pending-approval-allocation-rules.js";
import { PendingApprovalAllocationStore } from "./pending-approval-allocation-store.js";

/** Moves pending approval allocations through their life cycle and keeps a journal of what it did. */
export class PendingApprovalAllocationManager {
  store: PendingApprovalAllocationStore;
  validator: PendingApprovalAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingApprovalAllocationStore,
    validator: PendingApprovalAllocationValidator,
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
      throw new Error(`pending approval allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending approval allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingApprovalAllocationManager(store: PendingApprovalAllocationStore, clockValue: clock.Clock): PendingApprovalAllocationManager {
  return new PendingApprovalAllocationManager(store, defaultPendingApprovalAllocationValidator(), clockValue, []);
}
