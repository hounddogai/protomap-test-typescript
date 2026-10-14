import * as clock from "../../../../kit/clock.js";
import { ProofEntryEngine, defaultProofEntryEngine } from "./proof-entry-engine.js";
import { ProofEntryValidator, defaultProofEntryValidator } from "./proof-entry-rules.js";
import { ProofEntryStore } from "./proof-entry-store.js";

/** Moves proof entries through their life cycle and keeps a journal of what it did. */
export class ProofEntryService {
  store: ProofEntryStore;
  validator: ProofEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofEntryEngine;

  constructor(
    store: ProofEntryStore,
    validator: ProofEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofEntryEngine,
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
      throw new Error(`proof entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof entry ${code} not found`);
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

export function newProofEntryService(store: ProofEntryStore, clockValue: clock.Clock): ProofEntryService {
  return new ProofEntryService(store, defaultProofEntryValidator(), clockValue, [], defaultProofEntryEngine());
}
