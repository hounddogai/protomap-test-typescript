import * as clock from "../../../../kit/clock.js";
import {
  BatchedFunnelMappingValidator,
  defaultBatchedFunnelMappingValidator,
} from "./batched-funnel-mapping-rules.js";
import { BatchedFunnelMappingStore } from "./batched-funnel-mapping-store.js";

/** Moves batched funnel mappings through their life cycle and keeps a journal of what it did. */
export class BatchedFunnelMappingCoordinator {
  store: BatchedFunnelMappingStore;
  validator: BatchedFunnelMappingValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedFunnelMappingStore,
    validator: BatchedFunnelMappingValidator,
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
      throw new Error(`batched funnel mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched funnel mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newBatchedFunnelMappingCoordinator(store: BatchedFunnelMappingStore, clockValue: clock.Clock): BatchedFunnelMappingCoordinator {
  return new BatchedFunnelMappingCoordinator(store, defaultBatchedFunnelMappingValidator(), clockValue, []);
}
