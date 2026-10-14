import * as clock from "../../../../kit/clock.js";
import { ManualReplyVarianceValidator, defaultManualReplyVarianceValidator } from "./manual-reply-variance-rules.js";
import { ManualReplyVarianceStore } from "./manual-reply-variance-store.js";

/** Moves manual reply variances through their life cycle and keeps a journal of what it did. */
export class ManualReplyVarianceCoordinator {
  store: ManualReplyVarianceStore;
  validator: ManualReplyVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualReplyVarianceStore,
    validator: ManualReplyVarianceValidator,
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
      throw new Error(`manual reply variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual reply variance ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualReplyVarianceCoordinator(store: ManualReplyVarianceStore, clockValue: clock.Clock): ManualReplyVarianceCoordinator {
  return new ManualReplyVarianceCoordinator(store, defaultManualReplyVarianceValidator(), clockValue, []);
}
