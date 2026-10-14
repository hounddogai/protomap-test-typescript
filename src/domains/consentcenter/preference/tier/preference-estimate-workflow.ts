import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceEstimateEngine, defaultPreferenceEstimateEngine } from "./preference-estimate-engine.js";
import { PreferenceEstimateValidator, defaultPreferenceEstimateValidator } from "./preference-estimate-rules.js";
import { PreferenceEstimateStore } from "./preference-estimate-store.js";

/** Moves preference estimates through their life cycle and keeps a journal of what it did. */
export class PreferenceEstimateDesk {
  store: PreferenceEstimateStore;
  validator: PreferenceEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceEstimateEngine;

  constructor(
    store: PreferenceEstimateStore,
    validator: PreferenceEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceEstimateEngine,
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
      throw new Error(`preference estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference estimate ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPreferenceEstimateDesk(store: PreferenceEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceEstimateDesk {
  return new PreferenceEstimateDesk(
    store,
    defaultPreferenceEstimateValidator(),
    clockValue,
    [],
    defaultPreferenceEstimateEngine(flagsValue),
  );
}
