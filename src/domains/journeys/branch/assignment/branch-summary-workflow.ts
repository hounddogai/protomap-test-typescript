import * as clock from "../../../../kit/clock.js";
import { BranchSummaryValidator, defaultBranchSummaryValidator } from "./branch-summary-rules.js";
import { BranchSummaryStore } from "./branch-summary-store.js";

/** Moves branch summaries through their life cycle and keeps a journal of what it did. */
export class BranchSummaryDesk {
  store: BranchSummaryStore;
  validator: BranchSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BranchSummaryStore,
    validator: BranchSummaryValidator,
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
      throw new Error(`branch summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newBranchSummaryDesk(store: BranchSummaryStore, clockValue: clock.Clock): BranchSummaryDesk {
  return new BranchSummaryDesk(store, defaultBranchSummaryValidator(), clockValue, []);
}
