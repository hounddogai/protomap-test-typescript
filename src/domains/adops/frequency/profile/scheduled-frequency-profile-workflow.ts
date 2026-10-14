import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledFrequencyProfileEngine,
  defaultScheduledFrequencyProfileEngine,
} from "./scheduled-frequency-profile-engine.js";
import {
  ScheduledFrequencyProfileValidator,
  defaultScheduledFrequencyProfileValidator,
} from "./scheduled-frequency-profile-rules.js";
import { ScheduledFrequencyProfileStore } from "./scheduled-frequency-profile-store.js";

/** Moves scheduled frequency profiles through their life cycle and keeps a journal of what it did. */
export class ScheduledFrequencyProfileManager {
  store: ScheduledFrequencyProfileStore;
  validator: ScheduledFrequencyProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFrequencyProfileEngine;

  constructor(
    store: ScheduledFrequencyProfileStore,
    validator: ScheduledFrequencyProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFrequencyProfileEngine,
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
      throw new Error(`scheduled frequency profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled frequency profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled frequency profile ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newScheduledFrequencyProfileManager(store: ScheduledFrequencyProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledFrequencyProfileManager {
  return new ScheduledFrequencyProfileManager(
    store,
    defaultScheduledFrequencyProfileValidator(),
    clockValue,
    [],
    defaultScheduledFrequencyProfileEngine(flagsValue),
  );
}
