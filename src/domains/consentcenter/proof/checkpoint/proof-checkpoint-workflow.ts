import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ProofCheckpointEngine, defaultProofCheckpointEngine } from "./proof-checkpoint-engine.js";
import { ProofCheckpointValidator, defaultProofCheckpointValidator } from "./proof-checkpoint-rules.js";
import { ProofCheckpointStore } from "./proof-checkpoint-store.js";

/** Moves proof checkpoints through their life cycle and keeps a journal of what it did. */
export class ProofCheckpointWorkflow {
  store: ProofCheckpointStore;
  validator: ProofCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofCheckpointEngine;

  constructor(
    store: ProofCheckpointStore,
    validator: ProofCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofCheckpointEngine,
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
      throw new Error(`proof checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof checkpoint ${code} not found`);
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
      throw new Error(`proof checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newProofCheckpointWorkflow(store: ProofCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): ProofCheckpointWorkflow {
  return new ProofCheckpointWorkflow(
    store,
    defaultProofCheckpointValidator(),
    clockValue,
    [],
    defaultProofCheckpointEngine(flagsValue),
  );
}
