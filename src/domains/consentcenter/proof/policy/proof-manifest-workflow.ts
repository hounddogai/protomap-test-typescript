import * as clock from "../../../../kit/clock.js";
import { ProofManifestEngine, defaultProofManifestEngine } from "./proof-manifest-engine.js";
import { ProofManifestValidator, defaultProofManifestValidator } from "./proof-manifest-rules.js";
import { ProofManifestStore } from "./proof-manifest-store.js";

/** Moves proof manifests through their life cycle and keeps a journal of what it did. */
export class ProofManifestCoordinator {
  store: ProofManifestStore;
  validator: ProofManifestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofManifestEngine;

  constructor(
    store: ProofManifestStore,
    validator: ProofManifestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofManifestEngine,
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
      throw new Error(`proof manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof manifest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newProofManifestCoordinator(store: ProofManifestStore, clockValue: clock.Clock): ProofManifestCoordinator {
  return new ProofManifestCoordinator(
    store,
    defaultProofManifestValidator(),
    clockValue,
    [],
    defaultProofManifestEngine(),
  );
}
