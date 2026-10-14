import * as clock from "../../../../kit/clock.js";
import { GlobalMacroOverrideEngine, defaultGlobalMacroOverrideEngine } from "./global-macro-override-engine.js";
import { GlobalMacroOverrideValidator, defaultGlobalMacroOverrideValidator } from "./global-macro-override-rules.js";
import { GlobalMacroOverrideStore } from "./global-macro-override-store.js";

/** Moves global macro overrides through their life cycle and keeps a journal of what it did. */
export class GlobalMacroOverrideManager {
  store: GlobalMacroOverrideStore;
  validator: GlobalMacroOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalMacroOverrideEngine;

  constructor(
    store: GlobalMacroOverrideStore,
    validator: GlobalMacroOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalMacroOverrideEngine,
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
      throw new Error(`global macro override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global macro override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global macro override ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalMacroOverrideManager(store: GlobalMacroOverrideStore, clockValue: clock.Clock): GlobalMacroOverrideManager {
  return new GlobalMacroOverrideManager(
    store,
    defaultGlobalMacroOverrideValidator(),
    clockValue,
    [],
    defaultGlobalMacroOverrideEngine(),
  );
}
