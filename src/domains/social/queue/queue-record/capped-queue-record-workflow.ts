import * as clock from "../../../../kit/clock.js";
import { CappedQueueRecordEngine, defaultCappedQueueRecordEngine } from "./capped-queue-record-engine.js";
import { CappedQueueRecordValidator, defaultCappedQueueRecordValidator } from "./capped-queue-record-rules.js";
import { CappedQueueRecordStore } from "./capped-queue-record-store.js";

/** Moves capped queue records through their life cycle and keeps a journal of what it did. */
export class CappedQueueRecordWorkflow {
  store: CappedQueueRecordStore;
  validator: CappedQueueRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedQueueRecordEngine;

  constructor(
    store: CappedQueueRecordStore,
    validator: CappedQueueRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedQueueRecordEngine,
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
      throw new Error(`capped queue record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped queue record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped queue record ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedQueueRecordWorkflow(store: CappedQueueRecordStore, clockValue: clock.Clock): CappedQueueRecordWorkflow {
  return new CappedQueueRecordWorkflow(
    store,
    defaultCappedQueueRecordValidator(),
    clockValue,
    [],
    defaultCappedQueueRecordEngine(),
  );
}
