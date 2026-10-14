import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ProofProfileEngine, defaultProofProfileEngine } from "./proof-profile-engine.js";
import { ProofProfileValidator, defaultProofProfileValidator } from "./proof-profile-rules.js";
import { ProofProfileStore } from "./proof-profile-store.js";

/** Moves proof profiles through their life cycle and keeps a journal of what it did. */
export class ProofProfileWorkflow {
  store: ProofProfileStore;
  validator: ProofProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofProfileEngine;

  constructor(
    store: ProofProfileStore,
    validator: ProofProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofProfileEngine,
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
      throw new Error(`proof profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof profile ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newProofProfileWorkflow(store: ProofProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ProofProfileWorkflow {
  return new ProofProfileWorkflow(
    store,
    defaultProofProfileValidator(),
    clockValue,
    [],
    defaultProofProfileEngine(flagsValue),
  );
}
