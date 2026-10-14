import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedProofAssignmentEngine,
  defaultWeightedProofAssignmentEngine,
} from "./weighted-proof-assignment-engine.js";
import {
  WeightedProofAssignmentValidator,
  defaultWeightedProofAssignmentValidator,
} from "./weighted-proof-assignment-rules.js";
import { WeightedProofAssignmentStore } from "./weighted-proof-assignment-store.js";

/** Moves weighted proof assignments through their life cycle and keeps a journal of what it did. */
export class WeightedProofAssignmentWorkflow {
  store: WeightedProofAssignmentStore;
  validator: WeightedProofAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedProofAssignmentEngine;

  constructor(
    store: WeightedProofAssignmentStore,
    validator: WeightedProofAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedProofAssignmentEngine,
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
      throw new Error(`weighted proof assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted proof assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted proof assignment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedProofAssignmentWorkflow(store: WeightedProofAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedProofAssignmentWorkflow {
  return new WeightedProofAssignmentWorkflow(
    store,
    defaultWeightedProofAssignmentValidator(),
    clockValue,
    [],
    defaultWeightedProofAssignmentEngine(flagsValue),
  );
}
