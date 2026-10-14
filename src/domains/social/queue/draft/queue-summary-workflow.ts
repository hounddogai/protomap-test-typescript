import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { QueueSummaryEngine, defaultQueueSummaryEngine } from "./queue-summary-engine.js";
import { QueueSummaryValidator, defaultQueueSummaryValidator } from "./queue-summary-rules.js";
import { QueueSummaryStore } from "./queue-summary-store.js";

/** Moves queue summaries through their life cycle and keeps a journal of what it did. */
export class QueueSummaryWorkflow {
  store: QueueSummaryStore;
  validator: QueueSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueSummaryEngine;

  constructor(
    store: QueueSummaryStore,
    validator: QueueSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueSummaryEngine,
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
      throw new Error(`queue summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue summary ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newQueueSummaryWorkflow(store: QueueSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): QueueSummaryWorkflow {
  return new QueueSummaryWorkflow(
    store,
    defaultQueueSummaryValidator(),
    clockValue,
    [],
    defaultQueueSummaryEngine(flagsValue),
  );
}
