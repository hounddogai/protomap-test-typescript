import * as clock from "../../../../kit/clock.js";
import {
  RegionalDeflectionRecordEngine,
  defaultRegionalDeflectionRecordEngine,
} from "./regional-deflection-record-engine.js";
import {
  RegionalDeflectionRecordValidator,
  defaultRegionalDeflectionRecordValidator,
} from "./regional-deflection-record-rules.js";
import { RegionalDeflectionRecordStore } from "./regional-deflection-record-store.js";

/** Moves regional deflection records through their life cycle and keeps a journal of what it did. */
export class RegionalDeflectionRecordDesk {
  store: RegionalDeflectionRecordStore;
  validator: RegionalDeflectionRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalDeflectionRecordEngine;

  constructor(
    store: RegionalDeflectionRecordStore,
    validator: RegionalDeflectionRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalDeflectionRecordEngine,
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
      throw new Error(`regional deflection record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional deflection record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional deflection record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalDeflectionRecordDesk(store: RegionalDeflectionRecordStore, clockValue: clock.Clock): RegionalDeflectionRecordDesk {
  return new RegionalDeflectionRecordDesk(
    store,
    defaultRegionalDeflectionRecordValidator(),
    clockValue,
    [],
    defaultRegionalDeflectionRecordEngine(),
  );
}
