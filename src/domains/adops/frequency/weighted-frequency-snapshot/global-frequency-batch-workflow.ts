import * as clock from "../../../../kit/clock.js";
import {
  GlobalFrequencyBatchValidator,
  defaultGlobalFrequencyBatchValidator,
} from "./global-frequency-batch-rules.js";
import { GlobalFrequencyBatchStore } from "./global-frequency-batch-store.js";

/** Moves global frequency batches through their life cycle and keeps a journal of what it did. */
export class GlobalFrequencyBatchWorkflow {
  store: GlobalFrequencyBatchStore;
  validator: GlobalFrequencyBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalFrequencyBatchStore,
    validator: GlobalFrequencyBatchValidator,
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
      throw new Error(`global frequency batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global frequency batch ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalFrequencyBatchWorkflow(store: GlobalFrequencyBatchStore, clockValue: clock.Clock): GlobalFrequencyBatchWorkflow {
  return new GlobalFrequencyBatchWorkflow(store, defaultGlobalFrequencyBatchValidator(), clockValue, []);
}
