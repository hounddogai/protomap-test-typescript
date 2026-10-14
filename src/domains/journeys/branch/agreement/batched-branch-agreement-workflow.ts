import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedBranchAgreementEngine,
  defaultBatchedBranchAgreementEngine,
} from "./batched-branch-agreement-engine.js";
import {
  BatchedBranchAgreementValidator,
  defaultBatchedBranchAgreementValidator,
} from "./batched-branch-agreement-rules.js";
import { BatchedBranchAgreementStore } from "./batched-branch-agreement-store.js";

/** Moves batched branch agreements through their life cycle and keeps a journal of what it did. */
export class BatchedBranchAgreementWorkflow {
  store: BatchedBranchAgreementStore;
  validator: BatchedBranchAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedBranchAgreementEngine;

  constructor(
    store: BatchedBranchAgreementStore,
    validator: BatchedBranchAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedBranchAgreementEngine,
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
      throw new Error(`batched branch agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched branch agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched branch agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newBatchedBranchAgreementWorkflow(store: BatchedBranchAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedBranchAgreementWorkflow {
  return new BatchedBranchAgreementWorkflow(
    store,
    defaultBatchedBranchAgreementValidator(),
    clockValue,
    [],
    defaultBatchedBranchAgreementEngine(flagsValue),
  );
}
