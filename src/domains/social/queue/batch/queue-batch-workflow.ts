import * as clock from "../../../../kit/clock.js";
import { QueueBatchEngine, defaultQueueBatchEngine } from "./queue-batch-engine.js";
import { QueueBatchValidator, defaultQueueBatchValidator } from "./queue-batch-rules.js";
import { QueueBatchStore } from "./queue-batch-store.js";

/** Moves queue batches through their life cycle and keeps a journal of what it did. */
export class QueueBatchManager {
  store: QueueBatchStore;
  validator: QueueBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueBatchEngine;

  constructor(
    store: QueueBatchStore,
    validator: QueueBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueBatchEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue batch ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newQueueBatchManager(store: QueueBatchStore, clockValue: clock.Clock): QueueBatchManager {
  return new QueueBatchManager(store, defaultQueueBatchValidator(), clockValue, [], defaultQueueBatchEngine());
}
