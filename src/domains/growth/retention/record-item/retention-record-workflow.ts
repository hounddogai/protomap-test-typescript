import * as clock from "../../../../kit/clock.js";
import { RetentionRecordEngine, defaultRetentionRecordEngine } from "./retention-record-engine.js";
import { RetentionRecordValidator, defaultRetentionRecordValidator } from "./retention-record-rules.js";
import { RetentionRecordStore } from "./retention-record-store.js";

/** Moves retention records through their life cycle and keeps a journal of what it did. */
export class RetentionRecordCoordinator {
  store: RetentionRecordStore;
  validator: RetentionRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionRecordEngine;

  constructor(
    store: RetentionRecordStore,
    validator: RetentionRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionRecordEngine,
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
      throw new Error(`retention record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionRecordCoordinator(store: RetentionRecordStore, clockValue: clock.Clock): RetentionRecordCoordinator {
  return new RetentionRecordCoordinator(
    store,
    defaultRetentionRecordValidator(),
    clockValue,
    [],
    defaultRetentionRecordEngine(),
  );
}
