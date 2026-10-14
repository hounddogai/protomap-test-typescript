import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackCreditPreferenceEngine,
  defaultFallbackCreditPreferenceEngine,
} from "./fallback-credit-preference-engine.js";
import {
  FallbackCreditPreferenceValidator,
  defaultFallbackCreditPreferenceValidator,
} from "./fallback-credit-preference-rules.js";
import { FallbackCreditPreferenceStore } from "./fallback-credit-preference-store.js";

/** Moves fallback credit preferences through their life cycle and keeps a journal of what it did. */
export class FallbackCreditPreferenceManager {
  store: FallbackCreditPreferenceStore;
  validator: FallbackCreditPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackCreditPreferenceEngine;

  constructor(
    store: FallbackCreditPreferenceStore,
    validator: FallbackCreditPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackCreditPreferenceEngine,
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
      throw new Error(`fallback credit preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback credit preference ${code} not found`);
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
      throw new Error(`fallback credit preference ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFallbackCreditPreferenceManager(store: FallbackCreditPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackCreditPreferenceManager {
  return new FallbackCreditPreferenceManager(
    store,
    defaultFallbackCreditPreferenceValidator(),
    clockValue,
    [],
    defaultFallbackCreditPreferenceEngine(flagsValue),
  );
}
