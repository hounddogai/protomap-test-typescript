import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalCreativeRecordEngine,
  defaultRegionalCreativeRecordEngine,
} from "./regional-creative-record-engine.js";
import {
  RegionalCreativeRecordValidator,
  defaultRegionalCreativeRecordValidator,
} from "./regional-creative-record-rules.js";
import { RegionalCreativeRecordStore } from "./regional-creative-record-store.js";

/** Moves regional creative records through their life cycle and keeps a journal of what it did. */
export class RegionalCreativeRecordCoordinator {
  store: RegionalCreativeRecordStore;
  validator: RegionalCreativeRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalCreativeRecordEngine;

  constructor(
    store: RegionalCreativeRecordStore,
    validator: RegionalCreativeRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalCreativeRecordEngine,
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
      throw new Error(`regional creative record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional creative record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional creative record ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalCreativeRecordCoordinator(store: RegionalCreativeRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalCreativeRecordCoordinator {
  return new RegionalCreativeRecordCoordinator(
    store,
    defaultRegionalCreativeRecordValidator(),
    clockValue,
    [],
    defaultRegionalCreativeRecordEngine(flagsValue),
  );
}
