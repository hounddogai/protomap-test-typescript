import * as clock from "../../../../kit/clock.js";
import { ProofBundleEngine, defaultProofBundleEngine } from "./proof-bundle-engine.js";
import { ProofBundleValidator, defaultProofBundleValidator } from "./proof-bundle-rules.js";
import { ProofBundleStore } from "./proof-bundle-store.js";

/** Moves proof bundles through their life cycle and keeps a journal of what it did. */
export class ProofBundleDesk {
  store: ProofBundleStore;
  validator: ProofBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofBundleEngine;

  constructor(
    store: ProofBundleStore,
    validator: ProofBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofBundleEngine,
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
      throw new Error(`proof bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof bundle ${code} not found`);
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

export function newProofBundleDesk(store: ProofBundleStore, clockValue: clock.Clock): ProofBundleDesk {
  return new ProofBundleDesk(store, defaultProofBundleValidator(), clockValue, [], defaultProofBundleEngine());
}
