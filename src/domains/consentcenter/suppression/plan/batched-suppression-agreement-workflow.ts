import * as clock from "../../../../kit/clock.js";
import {
  BatchedSuppressionAgreementEngine,
  defaultBatchedSuppressionAgreementEngine,
} from "./batched-suppression-agreement-engine.js";
import {
  BatchedSuppressionAgreementValidator,
  defaultBatchedSuppressionAgreementValidator,
} from "./batched-suppression-agreement-rules.js";
import { BatchedSuppressionAgreementStore } from "./batched-suppression-agreement-store.js";

/** Moves batched suppression agreements through their life cycle and keeps a journal of what it did. */
export class BatchedSuppressionAgreementDesk {
  store: BatchedSuppressionAgreementStore;
  validator: BatchedSuppressionAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedSuppressionAgreementEngine;

  constructor(
    store: BatchedSuppressionAgreementStore,
    validator: BatchedSuppressionAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedSuppressionAgreementEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched suppression agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched suppression agreement ${code} not found`);
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
      throw new Error(`batched suppression agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBatchedSuppressionAgreementDesk(store: BatchedSuppressionAgreementStore, clockValue: clock.Clock): BatchedSuppressionAgreementDesk {
  return new BatchedSuppressionAgreementDesk(
    store,
    defaultBatchedSuppressionAgreementValidator(),
    clockValue,
    [],
    defaultBatchedSuppressionAgreementEngine(),
  );
}
