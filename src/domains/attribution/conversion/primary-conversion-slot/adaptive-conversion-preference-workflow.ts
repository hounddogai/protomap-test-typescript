import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveConversionPreferenceEngine,
  defaultAdaptiveConversionPreferenceEngine,
} from "./adaptive-conversion-preference-engine.js";
import {
  AdaptiveConversionPreferenceValidator,
  defaultAdaptiveConversionPreferenceValidator,
} from "./adaptive-conversion-preference-rules.js";
import { AdaptiveConversionPreferenceStore } from "./adaptive-conversion-preference-store.js";

/** Moves adaptive conversion preferences through their life cycle and keeps a journal of what it did. */
export class AdaptiveConversionPreferenceManager {
  store: AdaptiveConversionPreferenceStore;
  validator: AdaptiveConversionPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveConversionPreferenceEngine;

  constructor(
    store: AdaptiveConversionPreferenceStore,
    validator: AdaptiveConversionPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveConversionPreferenceEngine,
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
      throw new Error(`adaptive conversion preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive conversion preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive conversion preference ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newAdaptiveConversionPreferenceManager(store: AdaptiveConversionPreferenceStore, clockValue: clock.Clock): AdaptiveConversionPreferenceManager {
  return new AdaptiveConversionPreferenceManager(
    store,
    defaultAdaptiveConversionPreferenceValidator(),
    clockValue,
    [],
    defaultAdaptiveConversionPreferenceEngine(),
  );
}
