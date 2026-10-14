import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedFrequencyEntryEngine, defaultCappedFrequencyEntryEngine } from "./capped-frequency-entry-engine.js";
import {
  CappedFrequencyEntryValidator,
  defaultCappedFrequencyEntryValidator,
} from "./capped-frequency-entry-rules.js";
import { CappedFrequencyEntryStore } from "./capped-frequency-entry-store.js";

/** Moves capped frequency entries through their life cycle and keeps a journal of what it did. */
export class CappedFrequencyEntryDesk {
  store: CappedFrequencyEntryStore;
  validator: CappedFrequencyEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedFrequencyEntryEngine;

  constructor(
    store: CappedFrequencyEntryStore,
    validator: CappedFrequencyEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedFrequencyEntryEngine,
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
      throw new Error(`capped frequency entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped frequency entry ${code} not found`);
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
      throw new Error(`capped frequency entry ${code} not found`);
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

export function newCappedFrequencyEntryDesk(store: CappedFrequencyEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedFrequencyEntryDesk {
  return new CappedFrequencyEntryDesk(
    store,
    defaultCappedFrequencyEntryValidator(),
    clockValue,
    [],
    defaultCappedFrequencyEntryEngine(flagsValue),
  );
}
