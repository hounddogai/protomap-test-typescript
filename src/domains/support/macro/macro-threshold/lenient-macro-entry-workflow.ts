import * as clock from "../../../../kit/clock.js";
import { LenientMacroEntryEngine, defaultLenientMacroEntryEngine } from "./lenient-macro-entry-engine.js";
import { LenientMacroEntryValidator, defaultLenientMacroEntryValidator } from "./lenient-macro-entry-rules.js";
import { LenientMacroEntryStore } from "./lenient-macro-entry-store.js";

/** Moves lenient macro entries through their life cycle and keeps a journal of what it did. */
export class LenientMacroEntryDesk {
  store: LenientMacroEntryStore;
  validator: LenientMacroEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientMacroEntryEngine;

  constructor(
    store: LenientMacroEntryStore,
    validator: LenientMacroEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientMacroEntryEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient macro entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient macro entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient macro entry ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newLenientMacroEntryDesk(store: LenientMacroEntryStore, clockValue: clock.Clock): LenientMacroEntryDesk {
  return new LenientMacroEntryDesk(
    store,
    defaultLenientMacroEntryValidator(),
    clockValue,
    [],
    defaultLenientMacroEntryEngine(),
  );
}
