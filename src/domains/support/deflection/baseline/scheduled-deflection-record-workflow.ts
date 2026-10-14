import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledDeflectionRecordEngine,
  defaultScheduledDeflectionRecordEngine,
} from "./scheduled-deflection-record-engine.js";
import {
  ScheduledDeflectionRecordValidator,
  defaultScheduledDeflectionRecordValidator,
} from "./scheduled-deflection-record-rules.js";
import { ScheduledDeflectionRecordStore } from "./scheduled-deflection-record-store.js";

/** Moves scheduled deflection records through their life cycle and keeps a journal of what it did. */
export class ScheduledDeflectionRecordManager {
  store: ScheduledDeflectionRecordStore;
  validator: ScheduledDeflectionRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledDeflectionRecordEngine;

  constructor(
    store: ScheduledDeflectionRecordStore,
    validator: ScheduledDeflectionRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledDeflectionRecordEngine,
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
      throw new Error(`scheduled deflection record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledDeflectionRecordManager(store: ScheduledDeflectionRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledDeflectionRecordManager {
  return new ScheduledDeflectionRecordManager(
    store,
    defaultScheduledDeflectionRecordValidator(),
    clockValue,
    [],
    defaultScheduledDeflectionRecordEngine(flagsValue),
  );
}
