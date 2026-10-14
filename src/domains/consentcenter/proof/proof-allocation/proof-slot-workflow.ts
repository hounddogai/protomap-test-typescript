import * as clock from "../../../../kit/clock.js";
import { ProofSlotEngine, defaultProofSlotEngine } from "./proof-slot-engine.js";
import { ProofSlotValidator, defaultProofSlotValidator } from "./proof-slot-rules.js";
import { ProofSlotStore } from "./proof-slot-store.js";

/** Moves proof slots through their life cycle and keeps a journal of what it did. */
export class ProofSlotDesk {
  store: ProofSlotStore;
  validator: ProofSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofSlotEngine;

  constructor(
    store: ProofSlotStore,
    validator: ProofSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofSlotEngine,
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
      throw new Error(`proof slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newProofSlotDesk(store: ProofSlotStore, clockValue: clock.Clock): ProofSlotDesk {
  return new ProofSlotDesk(store, defaultProofSlotValidator(), clockValue, [], defaultProofSlotEngine());
}
