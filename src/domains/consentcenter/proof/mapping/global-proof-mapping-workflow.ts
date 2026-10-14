import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalProofMappingEngine, defaultGlobalProofMappingEngine } from "./global-proof-mapping-engine.js";
import { GlobalProofMappingValidator, defaultGlobalProofMappingValidator } from "./global-proof-mapping-rules.js";
import { GlobalProofMappingStore } from "./global-proof-mapping-store.js";

/** Moves global proof mappings through their life cycle and keeps a journal of what it did. */
export class GlobalProofMappingWorkflow {
  store: GlobalProofMappingStore;
  validator: GlobalProofMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalProofMappingEngine;

  constructor(
    store: GlobalProofMappingStore,
    validator: GlobalProofMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalProofMappingEngine,
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
      throw new Error(`global proof mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global proof mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global proof mapping ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newGlobalProofMappingWorkflow(store: GlobalProofMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalProofMappingWorkflow {
  return new GlobalProofMappingWorkflow(
    store,
    defaultGlobalProofMappingValidator(),
    clockValue,
    [],
    defaultGlobalProofMappingEngine(flagsValue),
  );
}
