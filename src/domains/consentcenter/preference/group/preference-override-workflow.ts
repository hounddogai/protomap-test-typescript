import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceOverrideEngine, defaultPreferenceOverrideEngine } from "./preference-override-engine.js";
import { PreferenceOverrideValidator, defaultPreferenceOverrideValidator } from "./preference-override-rules.js";
import { PreferenceOverrideStore } from "./preference-override-store.js";

/** Moves preference overrides through their life cycle and keeps a journal of what it did. */
export class PreferenceOverrideCoordinator {
  store: PreferenceOverrideStore;
  validator: PreferenceOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceOverrideEngine;

  constructor(
    store: PreferenceOverrideStore,
    validator: PreferenceOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceOverrideEngine,
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
      throw new Error(`preference override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference override ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPreferenceOverrideCoordinator(store: PreferenceOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceOverrideCoordinator {
  return new PreferenceOverrideCoordinator(
    store,
    defaultPreferenceOverrideValidator(),
    clockValue,
    [],
    defaultPreferenceOverrideEngine(flagsValue),
  );
}
