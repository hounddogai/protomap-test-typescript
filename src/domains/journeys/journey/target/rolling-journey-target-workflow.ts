import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingJourneyTargetEngine, defaultRollingJourneyTargetEngine } from "./rolling-journey-target-engine.js";
import {
  RollingJourneyTargetValidator,
  defaultRollingJourneyTargetValidator,
} from "./rolling-journey-target-rules.js";
import { RollingJourneyTargetStore } from "./rolling-journey-target-store.js";

/** Moves rolling journey targets through their life cycle and keeps a journal of what it did. */
export class RollingJourneyTargetDesk {
  store: RollingJourneyTargetStore;
  validator: RollingJourneyTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingJourneyTargetEngine;

  constructor(
    store: RollingJourneyTargetStore,
    validator: RollingJourneyTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingJourneyTargetEngine,
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
      throw new Error(`rolling journey target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling journey target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling journey target ${code} not found`);
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

export function newRollingJourneyTargetDesk(store: RollingJourneyTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingJourneyTargetDesk {
  return new RollingJourneyTargetDesk(
    store,
    defaultRollingJourneyTargetValidator(),
    clockValue,
    [],
    defaultRollingJourneyTargetEngine(flagsValue),
  );
}
