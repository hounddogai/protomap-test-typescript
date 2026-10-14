import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedFraudCheckReservationEngine,
  defaultBatchedFraudCheckReservationEngine,
} from "./batched-fraud-check-reservation-engine.js";
import {
  BatchedFraudCheckReservationValidator,
  defaultBatchedFraudCheckReservationValidator,
} from "./batched-fraud-check-reservation-rules.js";
import { BatchedFraudCheckReservationStore } from "./batched-fraud-check-reservation-store.js";

/** Moves batched fraud check reservations through their life cycle and keeps a journal of what it did. */
export class BatchedFraudCheckReservationWorkflow {
  store: BatchedFraudCheckReservationStore;
  validator: BatchedFraudCheckReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedFraudCheckReservationEngine;

  constructor(
    store: BatchedFraudCheckReservationStore,
    validator: BatchedFraudCheckReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedFraudCheckReservationEngine,
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
      throw new Error(`batched fraud check reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched fraud check reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched fraud check reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedFraudCheckReservationWorkflow(store: BatchedFraudCheckReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedFraudCheckReservationWorkflow {
  return new BatchedFraudCheckReservationWorkflow(
    store,
    defaultBatchedFraudCheckReservationValidator(),
    clockValue,
    [],
    defaultBatchedFraudCheckReservationEngine(flagsValue),
  );
}
