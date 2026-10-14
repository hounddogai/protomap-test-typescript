import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { MacroPreferenceEngine, defaultMacroPreferenceEngine } from "./macro-preference-engine.js";
import { MacroPreferenceValidator, defaultMacroPreferenceValidator } from "./macro-preference-rules.js";
import { MacroPreferenceStore } from "./macro-preference-store.js";

/** Moves macro preferences through their life cycle and keeps a journal of what it did. */
export class MacroPreferenceManager {
  store: MacroPreferenceStore;
  validator: MacroPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MacroPreferenceEngine;

  constructor(
    store: MacroPreferenceStore,
    validator: MacroPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MacroPreferenceEngine,
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
      throw new Error(`macro preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro preference ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newMacroPreferenceManager(store: MacroPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): MacroPreferenceManager {
  return new MacroPreferenceManager(
    store,
    defaultMacroPreferenceValidator(),
    clockValue,
    [],
    defaultMacroPreferenceEngine(flagsValue),
  );
}
