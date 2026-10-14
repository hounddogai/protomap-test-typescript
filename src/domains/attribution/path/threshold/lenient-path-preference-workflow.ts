import * as clock from "../../../../kit/clock.js";
import { LenientPathPreferenceEngine, defaultLenientPathPreferenceEngine } from "./lenient-path-preference-engine.js";
import {
  LenientPathPreferenceValidator,
  defaultLenientPathPreferenceValidator,
} from "./lenient-path-preference-rules.js";
import { LenientPathPreferenceStore } from "./lenient-path-preference-store.js";

/** Moves lenient path preferences through their life cycle and keeps a journal of what it did. */
export class LenientPathPreferenceCoordinator {
  store: LenientPathPreferenceStore;
  validator: LenientPathPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPathPreferenceEngine;

  constructor(
    store: LenientPathPreferenceStore,
    validator: LenientPathPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPathPreferenceEngine,
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
      throw new Error(`lenient path preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient path preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient path preference ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLenientPathPreferenceCoordinator(store: LenientPathPreferenceStore, clockValue: clock.Clock): LenientPathPreferenceCoordinator {
  return new LenientPathPreferenceCoordinator(
    store,
    defaultLenientPathPreferenceValidator(),
    clockValue,
    [],
    defaultLenientPathPreferenceEngine(),
  );
}
