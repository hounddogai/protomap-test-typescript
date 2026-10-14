import * as clock from "../../../../kit/clock.js";
import {
  BatchedConversionCycleValidator,
  defaultBatchedConversionCycleValidator,
} from "./batched-conversion-cycle-rules.js";
import { BatchedConversionCycleStore } from "./batched-conversion-cycle-store.js";

/** Moves batched conversion cycles through their life cycle and keeps a journal of what it did. */
export class BatchedConversionCycleService {
  store: BatchedConversionCycleStore;
  validator: BatchedConversionCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedConversionCycleStore,
    validator: BatchedConversionCycleValidator,
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
      throw new Error(`batched conversion cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched conversion cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newBatchedConversionCycleService(store: BatchedConversionCycleStore, clockValue: clock.Clock): BatchedConversionCycleService {
  return new BatchedConversionCycleService(store, defaultBatchedConversionCycleValidator(), clockValue, []);
}
