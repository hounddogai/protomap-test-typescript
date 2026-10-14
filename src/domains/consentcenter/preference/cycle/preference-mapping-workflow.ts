import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceMappingEngine, defaultPreferenceMappingEngine } from "./preference-mapping-engine.js";
import { PreferenceMappingValidator, defaultPreferenceMappingValidator } from "./preference-mapping-rules.js";
import { PreferenceMappingStore } from "./preference-mapping-store.js";

/** Moves preference mappings through their life cycle and keeps a journal of what it did. */
export class PreferenceMappingCoordinator {
  store: PreferenceMappingStore;
  validator: PreferenceMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceMappingEngine;

  constructor(
    store: PreferenceMappingStore,
    validator: PreferenceMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceMappingEngine,
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
      throw new Error(`preference mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPreferenceMappingCoordinator(store: PreferenceMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceMappingCoordinator {
  return new PreferenceMappingCoordinator(
    store,
    defaultPreferenceMappingValidator(),
    clockValue,
    [],
    defaultPreferenceMappingEngine(flagsValue),
  );
}
