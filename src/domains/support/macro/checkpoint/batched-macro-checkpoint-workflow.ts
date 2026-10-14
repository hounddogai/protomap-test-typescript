import * as clock from "../../../../kit/clock.js";
import {
  BatchedMacroCheckpointEngine,
  defaultBatchedMacroCheckpointEngine,
} from "./batched-macro-checkpoint-engine.js";
import {
  BatchedMacroCheckpointValidator,
  defaultBatchedMacroCheckpointValidator,
} from "./batched-macro-checkpoint-rules.js";
import { BatchedMacroCheckpointStore } from "./batched-macro-checkpoint-store.js";

/** Moves batched macro checkpoints through their life cycle and keeps a journal of what it did. */
export class BatchedMacroCheckpointService {
  store: BatchedMacroCheckpointStore;
  validator: BatchedMacroCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedMacroCheckpointEngine;

  constructor(
    store: BatchedMacroCheckpointStore,
    validator: BatchedMacroCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedMacroCheckpointEngine,
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
      throw new Error(`batched macro checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched macro checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched macro checkpoint ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBatchedMacroCheckpointService(store: BatchedMacroCheckpointStore, clockValue: clock.Clock): BatchedMacroCheckpointService {
  return new BatchedMacroCheckpointService(
    store,
    defaultBatchedMacroCheckpointValidator(),
    clockValue,
    [],
    defaultBatchedMacroCheckpointEngine(),
  );
}
