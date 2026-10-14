import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { QueueAllocationEngine, defaultQueueAllocationEngine } from "./queue-allocation-engine.js";
import { QueueAllocationValidator, defaultQueueAllocationValidator } from "./queue-allocation-rules.js";
import { QueueAllocationStore } from "./queue-allocation-store.js";

/** Moves queue allocations through their life cycle and keeps a journal of what it did. */
export class QueueAllocationWorkflow {
  store: QueueAllocationStore;
  validator: QueueAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueAllocationEngine;

  constructor(
    store: QueueAllocationStore,
    validator: QueueAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueAllocationEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue allocation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newQueueAllocationWorkflow(store: QueueAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): QueueAllocationWorkflow {
  return new QueueAllocationWorkflow(
    store,
    defaultQueueAllocationValidator(),
    clockValue,
    [],
    defaultQueueAllocationEngine(flagsValue),
  );
}
