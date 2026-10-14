import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ProofMappingEngine, defaultProofMappingEngine } from "./proof-mapping-engine.js";
import { ProofMappingValidator, defaultProofMappingValidator } from "./proof-mapping-rules.js";
import { ProofMappingStore } from "./proof-mapping-store.js";

/** Moves proof mappings through their life cycle and keeps a journal of what it did. */
export class ProofMappingWorkflow {
  store: ProofMappingStore;
  validator: ProofMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofMappingEngine;

  constructor(
    store: ProofMappingStore,
    validator: ProofMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofMappingEngine,
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
      throw new Error(`proof mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newProofMappingWorkflow(store: ProofMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): ProofMappingWorkflow {
  return new ProofMappingWorkflow(
    store,
    defaultProofMappingValidator(),
    clockValue,
    [],
    defaultProofMappingEngine(flagsValue),
  );
}
