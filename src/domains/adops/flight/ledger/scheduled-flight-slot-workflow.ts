import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ScheduledFlightSlotEngine, defaultScheduledFlightSlotEngine } from "./scheduled-flight-slot-engine.js";
import { ScheduledFlightSlotValidator, defaultScheduledFlightSlotValidator } from "./scheduled-flight-slot-rules.js";
import { ScheduledFlightSlotStore } from "./scheduled-flight-slot-store.js";

/** Moves scheduled flight slots through their life cycle and keeps a journal of what it did. */
export class ScheduledFlightSlotService {
  store: ScheduledFlightSlotStore;
  validator: ScheduledFlightSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFlightSlotEngine;

  constructor(
    store: ScheduledFlightSlotStore,
    validator: ScheduledFlightSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFlightSlotEngine,
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
      throw new Error(`scheduled flight slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight slot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledFlightSlotService(store: ScheduledFlightSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledFlightSlotService {
  return new ScheduledFlightSlotService(
    store,
    defaultScheduledFlightSlotValidator(),
    clockValue,
    [],
    defaultScheduledFlightSlotEngine(flagsValue),
  );
}
