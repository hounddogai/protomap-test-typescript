import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedFunnelAgreementEngine,
  defaultBatchedFunnelAgreementEngine,
} from "./batched-funnel-agreement-engine.js";
import {
  BatchedFunnelAgreementValidator,
  defaultBatchedFunnelAgreementValidator,
} from "./batched-funnel-agreement-rules.js";
import { BatchedFunnelAgreementStore } from "./batched-funnel-agreement-store.js";

/** Moves batched funnel agreements through their life cycle and keeps a journal of what it did. */
export class BatchedFunnelAgreementCoordinator {
  store: BatchedFunnelAgreementStore;
  validator: BatchedFunnelAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedFunnelAgreementEngine;

  constructor(
    store: BatchedFunnelAgreementStore,
    validator: BatchedFunnelAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedFunnelAgreementEngine,
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
      throw new Error(`batched funnel agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched funnel agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched funnel agreement ${code} not found`);
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

export function newBatchedFunnelAgreementCoordinator(store: BatchedFunnelAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedFunnelAgreementCoordinator {
  return new BatchedFunnelAgreementCoordinator(
    store,
    defaultBatchedFunnelAgreementValidator(),
    clockValue,
    [],
    defaultBatchedFunnelAgreementEngine(flagsValue),
  );
}
