import * as clock from "../../../../kit/clock.js";
import { BranchBatchValidator, defaultBranchBatchValidator } from "./branch-batch-rules.js";
import { BranchBatchStore } from "./branch-batch-store.js";

/** Moves branch batches through their life cycle and keeps a journal of what it did. */
export class BranchBatchService {
  store: BranchBatchStore;
  validator: BranchBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BranchBatchStore,
    validator: BranchBatchValidator,
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
      throw new Error(`branch batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch batch ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBranchBatchService(store: BranchBatchStore, clockValue: clock.Clock): BranchBatchService {
  return new BranchBatchService(store, defaultBranchBatchValidator(), clockValue, []);
}
