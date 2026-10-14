import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { OptOutPreferenceEngine, defaultOptOutPreferenceEngine } from "./opt-out-preference-engine.js";
import { OptOutPreferenceValidator, defaultOptOutPreferenceValidator } from "./opt-out-preference-rules.js";
import { OptOutPreferenceStore } from "./opt-out-preference-store.js";

/** Moves opt out preferences through their life cycle and keeps a journal of what it did. */
export class OptOutPreferenceManager {
  store: OptOutPreferenceStore;
  validator: OptOutPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutPreferenceEngine;

  constructor(
    store: OptOutPreferenceStore,
    validator: OptOutPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutPreferenceEngine,
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
      throw new Error(`opt out preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out preference ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newOptOutPreferenceManager(store: OptOutPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): OptOutPreferenceManager {
  return new OptOutPreferenceManager(
    store,
    defaultOptOutPreferenceValidator(),
    clockValue,
    [],
    defaultOptOutPreferenceEngine(flagsValue),
  );
}
