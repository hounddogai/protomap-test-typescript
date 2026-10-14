import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ProofCycleEngine, defaultProofCycleEngine } from "./proof-cycle-engine.js";
import { ProofCycleValidator, defaultProofCycleValidator } from "./proof-cycle-rules.js";
import { ProofCycleStore } from "./proof-cycle-store.js";

/** Moves proof cycles through their life cycle and keeps a journal of what it did. */
export class ProofCycleDesk {
  store: ProofCycleStore;
  validator: ProofCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofCycleEngine;

  constructor(
    store: ProofCycleStore,
    validator: ProofCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofCycleEngine,
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
      throw new Error(`proof cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof cycle ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newProofCycleDesk(store: ProofCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ProofCycleDesk {
  return new ProofCycleDesk(store, defaultProofCycleValidator(), clockValue, [], defaultProofCycleEngine(flagsValue));
}
