import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CsatMappingEngine, defaultCsatMappingEngine } from "./csat-mapping-engine.js";
import { CsatMappingValidator, defaultCsatMappingValidator } from "./csat-mapping-rules.js";
import { CsatMappingStore } from "./csat-mapping-store.js";

/** Moves csat mappings through their life cycle and keeps a journal of what it did. */
export class CsatMappingWorkflow {
  store: CsatMappingStore;
  validator: CsatMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatMappingEngine;

  constructor(
    store: CsatMappingStore,
    validator: CsatMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatMappingEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat mapping ${code} not found`);
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

export function newCsatMappingWorkflow(store: CsatMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): CsatMappingWorkflow {
  return new CsatMappingWorkflow(
    store,
    defaultCsatMappingValidator(),
    clockValue,
    [],
    defaultCsatMappingEngine(flagsValue),
  );
}
