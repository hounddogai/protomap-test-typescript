import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledCreativePreferenceEngine,
  defaultScheduledCreativePreferenceEngine,
} from "./scheduled-creative-preference-engine.js";
import {
  ScheduledCreativePreferenceValidator,
  defaultScheduledCreativePreferenceValidator,
} from "./scheduled-creative-preference-rules.js";
import { ScheduledCreativePreferenceStore } from "./scheduled-creative-preference-store.js";

/** Moves scheduled creative preferences through their life cycle and keeps a journal of what it did. */
export class ScheduledCreativePreferenceDesk {
  store: ScheduledCreativePreferenceStore;
  validator: ScheduledCreativePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledCreativePreferenceEngine;

  constructor(
    store: ScheduledCreativePreferenceStore,
    validator: ScheduledCreativePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledCreativePreferenceEngine,
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
      throw new Error(`scheduled creative preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled creative preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled creative preference ${code} not found`);
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

export function newScheduledCreativePreferenceDesk(store: ScheduledCreativePreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledCreativePreferenceDesk {
  return new ScheduledCreativePreferenceDesk(
    store,
    defaultScheduledCreativePreferenceValidator(),
    clockValue,
    [],
    defaultScheduledCreativePreferenceEngine(flagsValue),
  );
}
