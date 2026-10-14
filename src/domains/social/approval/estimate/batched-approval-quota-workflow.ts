import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedApprovalQuotaEngine, defaultBatchedApprovalQuotaEngine } from "./batched-approval-quota-engine.js";
import {
  BatchedApprovalQuotaValidator,
  defaultBatchedApprovalQuotaValidator,
} from "./batched-approval-quota-rules.js";
import { BatchedApprovalQuotaStore } from "./batched-approval-quota-store.js";

/** Moves batched approval quotas through their life cycle and keeps a journal of what it did. */
export class BatchedApprovalQuotaManager {
  store: BatchedApprovalQuotaStore;
  validator: BatchedApprovalQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedApprovalQuotaEngine;

  constructor(
    store: BatchedApprovalQuotaStore,
    validator: BatchedApprovalQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedApprovalQuotaEngine,
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
      throw new Error(`batched approval quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched approval quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched approval quota ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newBatchedApprovalQuotaManager(store: BatchedApprovalQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedApprovalQuotaManager {
  return new BatchedApprovalQuotaManager(
    store,
    defaultBatchedApprovalQuotaValidator(),
    clockValue,
    [],
    defaultBatchedApprovalQuotaEngine(flagsValue),
  );
}
