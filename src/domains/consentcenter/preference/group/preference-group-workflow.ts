import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceGroupEngine, defaultPreferenceGroupEngine } from "./preference-group-engine.js";
import { PreferenceGroupValidator, defaultPreferenceGroupValidator } from "./preference-group-rules.js";
import { PreferenceGroupStore } from "./preference-group-store.js";

/** Moves preference groups through their life cycle and keeps a journal of what it did. */
export class PreferenceGroupManager {
  store: PreferenceGroupStore;
  validator: PreferenceGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceGroupEngine;

  constructor(
    store: PreferenceGroupStore,
    validator: PreferenceGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceGroupEngine,
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
      throw new Error(`preference group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPreferenceGroupManager(store: PreferenceGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceGroupManager {
  return new PreferenceGroupManager(
    store,
    defaultPreferenceGroupValidator(),
    clockValue,
    [],
    defaultPreferenceGroupEngine(flagsValue),
  );
}
