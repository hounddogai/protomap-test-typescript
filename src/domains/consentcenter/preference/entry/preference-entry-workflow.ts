import * as clock from "../../../../kit/clock.js";
import { PreferenceEntryEngine, defaultPreferenceEntryEngine } from "./preference-entry-engine.js";
import { PreferenceEntryValidator, defaultPreferenceEntryValidator } from "./preference-entry-rules.js";
import { PreferenceEntryStore } from "./preference-entry-store.js";

/** Moves preference entries through their life cycle and keeps a journal of what it did. */
export class PreferenceEntryCoordinator {
  store: PreferenceEntryStore;
  validator: PreferenceEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceEntryEngine;

  constructor(
    store: PreferenceEntryStore,
    validator: PreferenceEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceEntryEngine,
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
      throw new Error(`preference entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference entry ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPreferenceEntryCoordinator(store: PreferenceEntryStore, clockValue: clock.Clock): PreferenceEntryCoordinator {
  return new PreferenceEntryCoordinator(
    store,
    defaultPreferenceEntryValidator(),
    clockValue,
    [],
    defaultPreferenceEntryEngine(),
  );
}
