import * as clock from "../../../../kit/clock.js";
import { BranchClaimValidator, defaultBranchClaimValidator } from "./branch-claim-rules.js";
import { BranchClaimStore } from "./branch-claim-store.js";

/** Moves branch claims through their life cycle and keeps a journal of what it did. */
export class BranchClaimDesk {
  store: BranchClaimStore;
  validator: BranchClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BranchClaimStore,
    validator: BranchClaimValidator,
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
      throw new Error(`branch claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch claim ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBranchClaimDesk(store: BranchClaimStore, clockValue: clock.Clock): BranchClaimDesk {
  return new BranchClaimDesk(store, defaultBranchClaimValidator(), clockValue, []);
}
