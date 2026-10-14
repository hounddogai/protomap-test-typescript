import * as clock from "../../../../kit/clock.js";
import { RollingMentionRecordEngine, defaultRollingMentionRecordEngine } from "./rolling-mention-record-engine.js";
import {
  RollingMentionRecordValidator,
  defaultRollingMentionRecordValidator,
} from "./rolling-mention-record-rules.js";
import { RollingMentionRecordStore } from "./rolling-mention-record-store.js";

/** Moves rolling mention records through their life cycle and keeps a journal of what it did. */
export class RollingMentionRecordWorkflow {
  store: RollingMentionRecordStore;
  validator: RollingMentionRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingMentionRecordEngine;

  constructor(
    store: RollingMentionRecordStore,
    validator: RollingMentionRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingMentionRecordEngine,
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
      throw new Error(`rolling mention record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling mention record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling mention record ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRollingMentionRecordWorkflow(store: RollingMentionRecordStore, clockValue: clock.Clock): RollingMentionRecordWorkflow {
  return new RollingMentionRecordWorkflow(
    store,
    defaultRollingMentionRecordValidator(),
    clockValue,
    [],
    defaultRollingMentionRecordEngine(),
  );
}
