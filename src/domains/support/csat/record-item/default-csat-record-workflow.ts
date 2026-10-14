import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultCsatRecordEngine, defaultDefaultCsatRecordEngine } from "./default-csat-record-engine.js";
import { DefaultCsatRecordValidator, defaultDefaultCsatRecordValidator } from "./default-csat-record-rules.js";
import { DefaultCsatRecordStore } from "./default-csat-record-store.js";

/** Moves default csat records through their life cycle and keeps a journal of what it did. */
export class DefaultCsatRecordCoordinator {
  store: DefaultCsatRecordStore;
  validator: DefaultCsatRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultCsatRecordEngine;

  constructor(
    store: DefaultCsatRecordStore,
    validator: DefaultCsatRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultCsatRecordEngine,
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
      throw new Error(`default csat record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default csat record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default csat record ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDefaultCsatRecordCoordinator(store: DefaultCsatRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultCsatRecordCoordinator {
  return new DefaultCsatRecordCoordinator(
    store,
    defaultDefaultCsatRecordValidator(),
    clockValue,
    [],
    defaultDefaultCsatRecordEngine(flagsValue),
  );
}
