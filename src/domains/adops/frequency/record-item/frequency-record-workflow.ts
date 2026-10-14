import * as clock from "../../../../kit/clock.js";
import { FrequencyRecordValidator, defaultFrequencyRecordValidator } from "./frequency-record-rules.js";
import { FrequencyRecordStore } from "./frequency-record-store.js";

/** Moves frequency records through their life cycle and keeps a journal of what it did. */
export class FrequencyRecordDesk {
  store: FrequencyRecordStore;
  validator: FrequencyRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FrequencyRecordStore,
    validator: FrequencyRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newFrequencyRecordDesk(store: FrequencyRecordStore, clockValue: clock.Clock): FrequencyRecordDesk {
  return new FrequencyRecordDesk(store, defaultFrequencyRecordValidator(), clockValue, []);
}
