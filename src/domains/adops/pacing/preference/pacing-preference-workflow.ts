import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingPreferenceEngine, defaultPacingPreferenceEngine } from "./pacing-preference-engine.js";
import { PacingPreferenceValidator, defaultPacingPreferenceValidator } from "./pacing-preference-rules.js";
import { PacingPreferenceStore } from "./pacing-preference-store.js";

/** Moves pacing preferences through their life cycle and keeps a journal of what it did. */
export class PacingPreferenceService {
  store: PacingPreferenceStore;
  validator: PacingPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingPreferenceEngine;

  constructor(
    store: PacingPreferenceStore,
    validator: PacingPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingPreferenceEngine,
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
      throw new Error(`pacing preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing preference ${code} not found`);
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
      throw new Error(`pacing preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPacingPreferenceService(store: PacingPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingPreferenceService {
  return new PacingPreferenceService(
    store,
    defaultPacingPreferenceValidator(),
    clockValue,
    [],
    defaultPacingPreferenceEngine(flagsValue),
  );
}
