import * as clock from "../../../../kit/clock.js";
import {
  ScheduledTouchpointRecordEngine,
  defaultScheduledTouchpointRecordEngine,
} from "./scheduled-touchpoint-record-engine.js";
import {
  ScheduledTouchpointRecordValidator,
  defaultScheduledTouchpointRecordValidator,
} from "./scheduled-touchpoint-record-rules.js";
import { ScheduledTouchpointRecordStore } from "./scheduled-touchpoint-record-store.js";

/** Moves scheduled touchpoint records through their life cycle and keeps a journal of what it did. */
export class ScheduledTouchpointRecordWorkflow {
  store: ScheduledTouchpointRecordStore;
  validator: ScheduledTouchpointRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledTouchpointRecordEngine;

  constructor(
    store: ScheduledTouchpointRecordStore,
    validator: ScheduledTouchpointRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledTouchpointRecordEngine,
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
      throw new Error(`scheduled touchpoint record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled touchpoint record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled touchpoint record ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newScheduledTouchpointRecordWorkflow(store: ScheduledTouchpointRecordStore, clockValue: clock.Clock): ScheduledTouchpointRecordWorkflow {
  return new ScheduledTouchpointRecordWorkflow(
    store,
    defaultScheduledTouchpointRecordValidator(),
    clockValue,
    [],
    defaultScheduledTouchpointRecordEngine(),
  );
}
