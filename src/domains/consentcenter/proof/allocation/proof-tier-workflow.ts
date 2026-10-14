import * as clock from "../../../../kit/clock.js";
import { ProofTierValidator, defaultProofTierValidator } from "./proof-tier-rules.js";
import { ProofTierStore } from "./proof-tier-store.js";

/** Moves proof tiers through their life cycle and keeps a journal of what it did. */
export class ProofTierService {
  store: ProofTierStore;
  validator: ProofTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: ProofTierStore, validator: ProofTierValidator, clockValue: clock.Clock, journal: string[]) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newProofTierService(store: ProofTierStore, clockValue: clock.Clock): ProofTierService {
  return new ProofTierService(store, defaultProofTierValidator(), clockValue, []);
}
