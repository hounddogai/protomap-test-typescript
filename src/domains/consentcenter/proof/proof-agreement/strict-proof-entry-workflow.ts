import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictProofEntryEngine, defaultStrictProofEntryEngine } from "./strict-proof-entry-engine.js";
import { StrictProofEntryValidator, defaultStrictProofEntryValidator } from "./strict-proof-entry-rules.js";
import { StrictProofEntryStore } from "./strict-proof-entry-store.js";

/** Moves strict proof entries through their life cycle and keeps a journal of what it did. */
export class StrictProofEntryDesk {
  store: StrictProofEntryStore;
  validator: StrictProofEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictProofEntryEngine;

  constructor(
    store: StrictProofEntryStore,
    validator: StrictProofEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictProofEntryEngine,
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
      throw new Error(`strict proof entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict proof entry ${code} not found`);
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
      throw new Error(`strict proof entry ${code} not found`);
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

export function newStrictProofEntryDesk(store: StrictProofEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictProofEntryDesk {
  return new StrictProofEntryDesk(
    store,
    defaultStrictProofEntryValidator(),
    clockValue,
    [],
    defaultStrictProofEntryEngine(flagsValue),
  );
}
