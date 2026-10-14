import * as clock from "../../../../kit/clock.js";
import { BatchedQueueAgreementEngine, defaultBatchedQueueAgreementEngine } from "./batched-queue-agreement-engine.js";
import {
  BatchedQueueAgreementValidator,
  defaultBatchedQueueAgreementValidator,
} from "./batched-queue-agreement-rules.js";
import { BatchedQueueAgreementStore } from "./batched-queue-agreement-store.js";

/** Moves batched queue agreements through their life cycle and keeps a journal of what it did. */
export class BatchedQueueAgreementWorkflow {
  store: BatchedQueueAgreementStore;
  validator: BatchedQueueAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedQueueAgreementEngine;

  constructor(
    store: BatchedQueueAgreementStore,
    validator: BatchedQueueAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedQueueAgreementEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched queue agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched queue agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched queue agreement ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedQueueAgreementWorkflow(store: BatchedQueueAgreementStore, clockValue: clock.Clock): BatchedQueueAgreementWorkflow {
  return new BatchedQueueAgreementWorkflow(
    store,
    defaultBatchedQueueAgreementValidator(),
    clockValue,
    [],
    defaultBatchedQueueAgreementEngine(),
  );
}
