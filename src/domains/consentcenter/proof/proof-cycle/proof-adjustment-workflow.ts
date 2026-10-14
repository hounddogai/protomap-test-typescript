import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ProofAdjustmentEngine, defaultProofAdjustmentEngine } from "./proof-adjustment-engine.js";
import { ProofAdjustmentValidator, defaultProofAdjustmentValidator } from "./proof-adjustment-rules.js";
import { ProofAdjustmentStore } from "./proof-adjustment-store.js";

/** Moves proof adjustments through their life cycle and keeps a journal of what it did. */
export class ProofAdjustmentCoordinator {
  store: ProofAdjustmentStore;
  validator: ProofAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofAdjustmentEngine;

  constructor(
    store: ProofAdjustmentStore,
    validator: ProofAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofAdjustmentEngine,
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
      throw new Error(`proof adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof adjustment ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newProofAdjustmentCoordinator(store: ProofAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): ProofAdjustmentCoordinator {
  return new ProofAdjustmentCoordinator(
    store,
    defaultProofAdjustmentValidator(),
    clockValue,
    [],
    defaultProofAdjustmentEngine(flagsValue),
  );
}
