import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceNoticeEngine, defaultPreferenceNoticeEngine } from "./preference-notice-engine.js";
import { PreferenceNoticeValidator, defaultPreferenceNoticeValidator } from "./preference-notice-rules.js";
import { PreferenceNoticeStore } from "./preference-notice-store.js";

/** Moves preference notices through their life cycle and keeps a journal of what it did. */
export class PreferenceNoticeManager {
  store: PreferenceNoticeStore;
  validator: PreferenceNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceNoticeEngine;

  constructor(
    store: PreferenceNoticeStore,
    validator: PreferenceNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceNoticeEngine,
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
      throw new Error(`preference notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPreferenceNoticeManager(store: PreferenceNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceNoticeManager {
  return new PreferenceNoticeManager(
    store,
    defaultPreferenceNoticeValidator(),
    clockValue,
    [],
    defaultPreferenceNoticeEngine(flagsValue),
  );
}
