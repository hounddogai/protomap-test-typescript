import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalEnrollmentMappingEngine,
  defaultRegionalEnrollmentMappingEngine,
} from "./regional-enrollment-mapping-engine.js";
import {
  RegionalEnrollmentMappingValidator,
  defaultRegionalEnrollmentMappingValidator,
} from "./regional-enrollment-mapping-rules.js";
import { RegionalEnrollmentMappingStore } from "./regional-enrollment-mapping-store.js";

/** Moves regional enrollment mappings through their life cycle and keeps a journal of what it did. */
export class RegionalEnrollmentMappingManager {
  store: RegionalEnrollmentMappingStore;
  validator: RegionalEnrollmentMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalEnrollmentMappingEngine;

  constructor(
    store: RegionalEnrollmentMappingStore,
    validator: RegionalEnrollmentMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalEnrollmentMappingEngine,
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
      throw new Error(`regional enrollment mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional enrollment mapping ${code} not found`);
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
      throw new Error(`regional enrollment mapping ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRegionalEnrollmentMappingManager(store: RegionalEnrollmentMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalEnrollmentMappingManager {
  return new RegionalEnrollmentMappingManager(
    store,
    defaultRegionalEnrollmentMappingValidator(),
    clockValue,
    [],
    defaultRegionalEnrollmentMappingEngine(flagsValue),
  );
}
