import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingWaitSummaryEngine, defaultPendingWaitSummaryEngine } from "./pending-wait-summary-engine.js";
import { PendingWaitSummaryValidator, defaultPendingWaitSummaryValidator } from "./pending-wait-summary-rules.js";
import { PendingWaitSummaryStore } from "./pending-wait-summary-store.js";

/** Moves pending wait summaries through their life cycle and keeps a journal of what it did. */
export class PendingWaitSummaryWorkflow {
  store: PendingWaitSummaryStore;
  validator: PendingWaitSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingWaitSummaryEngine;

  constructor(
    store: PendingWaitSummaryStore,
    validator: PendingWaitSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingWaitSummaryEngine,
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
      throw new Error(`pending wait summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending wait summary ${code} not found`);
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
      throw new Error(`pending wait summary ${code} not found`);
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

export function newPendingWaitSummaryWorkflow(store: PendingWaitSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingWaitSummaryWorkflow {
  return new PendingWaitSummaryWorkflow(
    store,
    defaultPendingWaitSummaryValidator(),
    clockValue,
    [],
    defaultPendingWaitSummaryEngine(flagsValue),
  );
}
