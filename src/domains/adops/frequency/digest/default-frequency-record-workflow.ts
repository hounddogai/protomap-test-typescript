import * as clock from "../../../../kit/clock.js";
import {
  DefaultFrequencyRecordEngine,
  defaultDefaultFrequencyRecordEngine,
} from "./default-frequency-record-engine.js";
import {
  DefaultFrequencyRecordValidator,
  defaultDefaultFrequencyRecordValidator,
} from "./default-frequency-record-rules.js";
import { DefaultFrequencyRecordStore } from "./default-frequency-record-store.js";

/** Moves default frequency records through their life cycle and keeps a journal of what it did. */
export class DefaultFrequencyRecordDesk {
  store: DefaultFrequencyRecordStore;
  validator: DefaultFrequencyRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultFrequencyRecordEngine;

  constructor(
    store: DefaultFrequencyRecordStore,
    validator: DefaultFrequencyRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultFrequencyRecordEngine,
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
      throw new Error(`default frequency record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default frequency record ${code} not found`);
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
      throw new Error(`default frequency record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDefaultFrequencyRecordDesk(store: DefaultFrequencyRecordStore, clockValue: clock.Clock): DefaultFrequencyRecordDesk {
  return new DefaultFrequencyRecordDesk(
    store,
    defaultDefaultFrequencyRecordValidator(),
    clockValue,
    [],
    defaultDefaultFrequencyRecordEngine(),
  );
}
