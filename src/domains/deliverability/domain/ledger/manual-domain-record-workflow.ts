import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualDomainRecordEngine, defaultManualDomainRecordEngine } from "./manual-domain-record-engine.js";
import { ManualDomainRecordValidator, defaultManualDomainRecordValidator } from "./manual-domain-record-rules.js";
import { ManualDomainRecordStore } from "./manual-domain-record-store.js";

/** Moves manual domain records through their life cycle and keeps a journal of what it did. */
export class ManualDomainRecordManager {
  store: ManualDomainRecordStore;
  validator: ManualDomainRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualDomainRecordEngine;

  constructor(
    store: ManualDomainRecordStore,
    validator: ManualDomainRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualDomainRecordEngine,
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
      throw new Error(`manual domain record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual domain record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual domain record ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newManualDomainRecordManager(store: ManualDomainRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualDomainRecordManager {
  return new ManualDomainRecordManager(
    store,
    defaultManualDomainRecordValidator(),
    clockValue,
    [],
    defaultManualDomainRecordEngine(flagsValue),
  );
}
