import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientPreferenceWindowEngine,
  defaultLenientPreferenceWindowEngine,
} from "./lenient-preference-window-engine.js";
import {
  LenientPreferenceWindowValidator,
  defaultLenientPreferenceWindowValidator,
} from "./lenient-preference-window-rules.js";
import { LenientPreferenceWindowStore } from "./lenient-preference-window-store.js";

/** Moves lenient preference windows through their life cycle and keeps a journal of what it did. */
export class LenientPreferenceWindowService {
  store: LenientPreferenceWindowStore;
  validator: LenientPreferenceWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPreferenceWindowEngine;

  constructor(
    store: LenientPreferenceWindowStore,
    validator: LenientPreferenceWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPreferenceWindowEngine,
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
      throw new Error(`lenient preference window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient preference window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient preference window ${code} not found`);
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

export function newLenientPreferenceWindowService(store: LenientPreferenceWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientPreferenceWindowService {
  return new LenientPreferenceWindowService(
    store,
    defaultLenientPreferenceWindowValidator(),
    clockValue,
    [],
    defaultLenientPreferenceWindowEngine(flagsValue),
  );
}
