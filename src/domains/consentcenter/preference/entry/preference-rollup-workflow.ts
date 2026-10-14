import * as clock from "../../../../kit/clock.js";
import { PreferenceRollupEngine, defaultPreferenceRollupEngine } from "./preference-rollup-engine.js";
import { PreferenceRollupValidator, defaultPreferenceRollupValidator } from "./preference-rollup-rules.js";
import { PreferenceRollupStore } from "./preference-rollup-store.js";

/** Moves preference rollups through their life cycle and keeps a journal of what it did. */
export class PreferenceRollupManager {
  store: PreferenceRollupStore;
  validator: PreferenceRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceRollupEngine;

  constructor(
    store: PreferenceRollupStore,
    validator: PreferenceRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceRollupEngine,
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
      throw new Error(`preference rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference rollup ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPreferenceRollupManager(store: PreferenceRollupStore, clockValue: clock.Clock): PreferenceRollupManager {
  return new PreferenceRollupManager(
    store,
    defaultPreferenceRollupValidator(),
    clockValue,
    [],
    defaultPreferenceRollupEngine(),
  );
}
