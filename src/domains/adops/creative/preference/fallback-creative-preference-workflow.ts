import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackCreativePreferenceEngine,
  defaultFallbackCreativePreferenceEngine,
} from "./fallback-creative-preference-engine.js";
import {
  FallbackCreativePreferenceValidator,
  defaultFallbackCreativePreferenceValidator,
} from "./fallback-creative-preference-rules.js";
import { FallbackCreativePreferenceStore } from "./fallback-creative-preference-store.js";

/** Moves fallback creative preferences through their life cycle and keeps a journal of what it did. */
export class FallbackCreativePreferenceDesk {
  store: FallbackCreativePreferenceStore;
  validator: FallbackCreativePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackCreativePreferenceEngine;

  constructor(
    store: FallbackCreativePreferenceStore,
    validator: FallbackCreativePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackCreativePreferenceEngine,
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
      throw new Error(`fallback creative preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback creative preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback creative preference ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newFallbackCreativePreferenceDesk(store: FallbackCreativePreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackCreativePreferenceDesk {
  return new FallbackCreativePreferenceDesk(
    store,
    defaultFallbackCreativePreferenceValidator(),
    clockValue,
    [],
    defaultFallbackCreativePreferenceEngine(flagsValue),
  );
}
