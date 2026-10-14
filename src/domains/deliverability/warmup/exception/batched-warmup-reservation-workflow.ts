import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedWarmupReservationEngine,
  defaultBatchedWarmupReservationEngine,
} from "./batched-warmup-reservation-engine.js";
import {
  BatchedWarmupReservationValidator,
  defaultBatchedWarmupReservationValidator,
} from "./batched-warmup-reservation-rules.js";
import { BatchedWarmupReservationStore } from "./batched-warmup-reservation-store.js";

/** Moves batched warmup reservations through their life cycle and keeps a journal of what it did. */
export class BatchedWarmupReservationCoordinator {
  store: BatchedWarmupReservationStore;
  validator: BatchedWarmupReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedWarmupReservationEngine;

  constructor(
    store: BatchedWarmupReservationStore,
    validator: BatchedWarmupReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedWarmupReservationEngine,
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
      throw new Error(`batched warmup reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched warmup reservation ${code} not found`);
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
      throw new Error(`batched warmup reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedWarmupReservationCoordinator(store: BatchedWarmupReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedWarmupReservationCoordinator {
  return new BatchedWarmupReservationCoordinator(
    store,
    defaultBatchedWarmupReservationValidator(),
    clockValue,
    [],
    defaultBatchedWarmupReservationEngine(flagsValue),
  );
}
