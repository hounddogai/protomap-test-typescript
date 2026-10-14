import * as clock from "../../../../kit/clock.js";
import { CappedProofCycleValidator, defaultCappedProofCycleValidator } from "./capped-proof-cycle-rules.js";
import { CappedProofCycleStore } from "./capped-proof-cycle-store.js";

/** Moves capped proof cycles through their life cycle and keeps a journal of what it did. */
export class CappedProofCycleWorkflow {
  store: CappedProofCycleStore;
  validator: CappedProofCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedProofCycleStore,
    validator: CappedProofCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
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
      throw new Error(`capped proof cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped proof cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newCappedProofCycleWorkflow(store: CappedProofCycleStore, clockValue: clock.Clock): CappedProofCycleWorkflow {
  return new CappedProofCycleWorkflow(store, defaultCappedProofCycleValidator(), clockValue, []);
}
