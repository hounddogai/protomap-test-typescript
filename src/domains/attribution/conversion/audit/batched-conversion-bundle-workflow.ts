import * as clock from "../../../../kit/clock.js";
import {
  BatchedConversionBundleValidator,
  defaultBatchedConversionBundleValidator,
} from "./batched-conversion-bundle-rules.js";
import { BatchedConversionBundleStore } from "./batched-conversion-bundle-store.js";

/** Moves batched conversion bundles through their life cycle and keeps a journal of what it did. */
export class BatchedConversionBundleDesk {
  store: BatchedConversionBundleStore;
  validator: BatchedConversionBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedConversionBundleStore,
    validator: BatchedConversionBundleValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched conversion bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched conversion bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newBatchedConversionBundleDesk(store: BatchedConversionBundleStore, clockValue: clock.Clock): BatchedConversionBundleDesk {
  return new BatchedConversionBundleDesk(store, defaultBatchedConversionBundleValidator(), clockValue, []);
}
