import * as clock from "../../../../kit/clock.js";
import { PreferenceAllocationEngine, defaultPreferenceAllocationEngine } from "./preference-allocation-engine.js";
import {
  PreferenceAllocationValidator,
  defaultPreferenceAllocationValidator,
} from "./preference-allocation-rules.js";
import { PreferenceAllocationStore } from "./preference-allocation-store.js";

/** Moves preference allocations through their life cycle and keeps a journal of what it did. */
export class PreferenceAllocationManager {
  store: PreferenceAllocationStore;
  validator: PreferenceAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceAllocationEngine;

  constructor(
    store: PreferenceAllocationStore,
    validator: PreferenceAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceAllocationEngine,
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
      throw new Error(`preference allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference allocation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPreferenceAllocationManager(store: PreferenceAllocationStore, clockValue: clock.Clock): PreferenceAllocationManager {
  return new PreferenceAllocationManager(
    store,
    defaultPreferenceAllocationValidator(),
    clockValue,
    [],
    defaultPreferenceAllocationEngine(),
  );
}
