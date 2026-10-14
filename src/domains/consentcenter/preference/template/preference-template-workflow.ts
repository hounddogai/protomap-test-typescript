import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceTemplateEngine, defaultPreferenceTemplateEngine } from "./preference-template-engine.js";
import { PreferenceTemplateValidator, defaultPreferenceTemplateValidator } from "./preference-template-rules.js";
import { PreferenceTemplateStore } from "./preference-template-store.js";

/** Moves preference templates through their life cycle and keeps a journal of what it did. */
export class PreferenceTemplateManager {
  store: PreferenceTemplateStore;
  validator: PreferenceTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceTemplateEngine;

  constructor(
    store: PreferenceTemplateStore,
    validator: PreferenceTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceTemplateEngine,
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
      throw new Error(`preference template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference template ${code} not found`);
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
      throw new Error(`preference template ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPreferenceTemplateManager(store: PreferenceTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceTemplateManager {
  return new PreferenceTemplateManager(
    store,
    defaultPreferenceTemplateValidator(),
    clockValue,
    [],
    defaultPreferenceTemplateEngine(flagsValue),
  );
}
