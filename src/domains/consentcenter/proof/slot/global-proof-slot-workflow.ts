import * as clock from "../../../../kit/clock.js";
import { GlobalProofSlotEngine, defaultGlobalProofSlotEngine } from "./global-proof-slot-engine.js";
import { GlobalProofSlotValidator, defaultGlobalProofSlotValidator } from "./global-proof-slot-rules.js";
import { GlobalProofSlotStore } from "./global-proof-slot-store.js";

/** Moves global proof slots through their life cycle and keeps a journal of what it did. */
export class GlobalProofSlotCoordinator {
  store: GlobalProofSlotStore;
  validator: GlobalProofSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalProofSlotEngine;

  constructor(
    store: GlobalProofSlotStore,
    validator: GlobalProofSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalProofSlotEngine,
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
      throw new Error(`global proof slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global proof slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global proof slot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newGlobalProofSlotCoordinator(store: GlobalProofSlotStore, clockValue: clock.Clock): GlobalProofSlotCoordinator {
  return new GlobalProofSlotCoordinator(
    store,
    defaultGlobalProofSlotValidator(),
    clockValue,
    [],
    defaultGlobalProofSlotEngine(),
  );
}
