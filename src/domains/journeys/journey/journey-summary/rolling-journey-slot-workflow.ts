import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingJourneySlotEngine, defaultRollingJourneySlotEngine } from "./rolling-journey-slot-engine.js";
import { RollingJourneySlotValidator, defaultRollingJourneySlotValidator } from "./rolling-journey-slot-rules.js";
import { RollingJourneySlotStore } from "./rolling-journey-slot-store.js";

/** Moves rolling journey slots through their life cycle and keeps a journal of what it did. */
export class RollingJourneySlotWorkflow {
  store: RollingJourneySlotStore;
  validator: RollingJourneySlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingJourneySlotEngine;

  constructor(
    store: RollingJourneySlotStore,
    validator: RollingJourneySlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingJourneySlotEngine,
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
      throw new Error(`rolling journey slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling journey slot ${code} not found`);
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
      throw new Error(`rolling journey slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingJourneySlotWorkflow(store: RollingJourneySlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingJourneySlotWorkflow {
  return new RollingJourneySlotWorkflow(
    store,
    defaultRollingJourneySlotValidator(),
    clockValue,
    [],
    defaultRollingJourneySlotEngine(flagsValue),
  );
}
