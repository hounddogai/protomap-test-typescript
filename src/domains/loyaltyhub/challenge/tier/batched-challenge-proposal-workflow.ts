import * as clock from "../../../../kit/clock.js";
import {
  BatchedChallengeProposalEngine,
  defaultBatchedChallengeProposalEngine,
} from "./batched-challenge-proposal-engine.js";
import {
  BatchedChallengeProposalValidator,
  defaultBatchedChallengeProposalValidator,
} from "./batched-challenge-proposal-rules.js";
import { BatchedChallengeProposalStore } from "./batched-challenge-proposal-store.js";

/** Moves batched challenge proposals through their life cycle and keeps a journal of what it did. */
export class BatchedChallengeProposalService {
  store: BatchedChallengeProposalStore;
  validator: BatchedChallengeProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedChallengeProposalEngine;

  constructor(
    store: BatchedChallengeProposalStore,
    validator: BatchedChallengeProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedChallengeProposalEngine,
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
      throw new Error(`batched challenge proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched challenge proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched challenge proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newBatchedChallengeProposalService(store: BatchedChallengeProposalStore, clockValue: clock.Clock): BatchedChallengeProposalService {
  return new BatchedChallengeProposalService(
    store,
    defaultBatchedChallengeProposalValidator(),
    clockValue,
    [],
    defaultBatchedChallengeProposalEngine(),
  );
}
