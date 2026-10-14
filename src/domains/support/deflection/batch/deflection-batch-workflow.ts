import * as clock from "../../../../kit/clock.js";
import { DeflectionBatchValidator, defaultDeflectionBatchValidator } from "./deflection-batch-rules.js";
import { DeflectionBatchStore } from "./deflection-batch-store.js";

/** Moves deflection batches through their life cycle and keeps a journal of what it did. */
export class DeflectionBatchManager {
  store: DeflectionBatchStore;
  validator: DeflectionBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DeflectionBatchStore,
    validator: DeflectionBatchValidator,
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
      throw new Error(`deflection batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newDeflectionBatchManager(store: DeflectionBatchStore, clockValue: clock.Clock): DeflectionBatchManager {
  return new DeflectionBatchManager(store, defaultDeflectionBatchValidator(), clockValue, []);
}
