import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedFrequencySlotEngine, defaultCappedFrequencySlotEngine } from "./capped-frequency-slot-engine.js";
import { CappedFrequencySlotValidator, defaultCappedFrequencySlotValidator } from "./capped-frequency-slot-rules.js";
import { CappedFrequencySlotStore } from "./capped-frequency-slot-store.js";

/** Moves capped frequency slots through their life cycle and keeps a journal of what it did. */
export class CappedFrequencySlotDesk {
  store: CappedFrequencySlotStore;
  validator: CappedFrequencySlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedFrequencySlotEngine;

  constructor(
    store: CappedFrequencySlotStore,
    validator: CappedFrequencySlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedFrequencySlotEngine,
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
      throw new Error(`capped frequency slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped frequency slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped frequency slot ${code} not found`);
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

export function newCappedFrequencySlotDesk(store: CappedFrequencySlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedFrequencySlotDesk {
  return new CappedFrequencySlotDesk(
    store,
    defaultCappedFrequencySlotValidator(),
    clockValue,
    [],
    defaultCappedFrequencySlotEngine(flagsValue),
  );
}
