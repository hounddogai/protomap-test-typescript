import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceVarianceEngine, defaultPreferenceVarianceEngine } from "./preference-variance-engine.js";
import { PreferenceVarianceValidator, defaultPreferenceVarianceValidator } from "./preference-variance-rules.js";
import { PreferenceVarianceStore } from "./preference-variance-store.js";

/** Moves preference variances through their life cycle and keeps a journal of what it did. */
export class PreferenceVarianceService {
  store: PreferenceVarianceStore;
  validator: PreferenceVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceVarianceEngine;

  constructor(
    store: PreferenceVarianceStore,
    validator: PreferenceVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceVarianceEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPreferenceVarianceService(store: PreferenceVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceVarianceService {
  return new PreferenceVarianceService(
    store,
    defaultPreferenceVarianceValidator(),
    clockValue,
    [],
    defaultPreferenceVarianceEngine(flagsValue),
  );
}
