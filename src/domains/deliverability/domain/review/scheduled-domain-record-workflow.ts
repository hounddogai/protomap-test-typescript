import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ScheduledDomainRecordEngine, defaultScheduledDomainRecordEngine } from "./scheduled-domain-record-engine.js";
import {
  ScheduledDomainRecordValidator,
  defaultScheduledDomainRecordValidator,
} from "./scheduled-domain-record-rules.js";
import { ScheduledDomainRecordStore } from "./scheduled-domain-record-store.js";

/** Moves scheduled domain records through their life cycle and keeps a journal of what it did. */
export class ScheduledDomainRecordWorkflow {
  store: ScheduledDomainRecordStore;
  validator: ScheduledDomainRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledDomainRecordEngine;

  constructor(
    store: ScheduledDomainRecordStore,
    validator: ScheduledDomainRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledDomainRecordEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled domain record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled domain record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled domain record ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledDomainRecordWorkflow(store: ScheduledDomainRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledDomainRecordWorkflow {
  return new ScheduledDomainRecordWorkflow(
    store,
    defaultScheduledDomainRecordValidator(),
    clockValue,
    [],
    defaultScheduledDomainRecordEngine(flagsValue),
  );
}
