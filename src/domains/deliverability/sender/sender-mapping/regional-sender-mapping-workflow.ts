import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalSenderMappingEngine, defaultRegionalSenderMappingEngine } from "./regional-sender-mapping-engine.js";
import {
  RegionalSenderMappingValidator,
  defaultRegionalSenderMappingValidator,
} from "./regional-sender-mapping-rules.js";
import { RegionalSenderMappingStore } from "./regional-sender-mapping-store.js";

/** Moves regional sender mappings through their life cycle and keeps a journal of what it did. */
export class RegionalSenderMappingWorkflow {
  store: RegionalSenderMappingStore;
  validator: RegionalSenderMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalSenderMappingEngine;

  constructor(
    store: RegionalSenderMappingStore,
    validator: RegionalSenderMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalSenderMappingEngine,
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
      throw new Error(`regional sender mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sender mapping ${code} not found`);
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
      throw new Error(`regional sender mapping ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRegionalSenderMappingWorkflow(store: RegionalSenderMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalSenderMappingWorkflow {
  return new RegionalSenderMappingWorkflow(
    store,
    defaultRegionalSenderMappingValidator(),
    clockValue,
    [],
    defaultRegionalSenderMappingEngine(flagsValue),
  );
}
