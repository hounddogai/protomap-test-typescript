import * as clock from "../../../../kit/clock.js";
import {
  LegacyDeflectionRecordValidator,
  defaultLegacyDeflectionRecordValidator,
} from "./legacy-deflection-record-rules.js";
import { LegacyDeflectionRecordStore } from "./legacy-deflection-record-store.js";

/** Moves legacy deflection records through their life cycle and keeps a journal of what it did. */
export class LegacyDeflectionRecordWorkflow {
  store: LegacyDeflectionRecordStore;
  validator: LegacyDeflectionRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyDeflectionRecordStore,
    validator: LegacyDeflectionRecordValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newLegacyDeflectionRecordWorkflow(store: LegacyDeflectionRecordStore, clockValue: clock.Clock): LegacyDeflectionRecordWorkflow {
  return new LegacyDeflectionRecordWorkflow(store, defaultLegacyDeflectionRecordValidator(), clockValue, []);
}
