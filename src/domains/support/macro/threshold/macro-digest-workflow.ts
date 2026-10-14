import * as clock from "../../../../kit/clock.js";
import { MacroDigestEngine, defaultMacroDigestEngine } from "./macro-digest-engine.js";
import { MacroDigestValidator, defaultMacroDigestValidator } from "./macro-digest-rules.js";
import { MacroDigestStore } from "./macro-digest-store.js";

/** Moves macro digests through their life cycle and keeps a journal of what it did. */
export class MacroDigestManager {
  store: MacroDigestStore;
  validator: MacroDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MacroDigestEngine;

  constructor(
    store: MacroDigestStore,
    validator: MacroDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MacroDigestEngine,
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
      throw new Error(`macro digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro digest ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newMacroDigestManager(store: MacroDigestStore, clockValue: clock.Clock): MacroDigestManager {
  return new MacroDigestManager(store, defaultMacroDigestValidator(), clockValue, [], defaultMacroDigestEngine());
}
