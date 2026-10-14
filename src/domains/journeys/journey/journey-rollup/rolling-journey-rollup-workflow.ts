import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingJourneyRollupEngine, defaultRollingJourneyRollupEngine } from "./rolling-journey-rollup-engine.js";
import {
  RollingJourneyRollupValidator,
  defaultRollingJourneyRollupValidator,
} from "./rolling-journey-rollup-rules.js";
import { RollingJourneyRollupStore } from "./rolling-journey-rollup-store.js";

/** Moves rolling journey rollups through their life cycle and keeps a journal of what it did. */
export class RollingJourneyRollupWorkflow {
  store: RollingJourneyRollupStore;
  validator: RollingJourneyRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingJourneyRollupEngine;

  constructor(
    store: RollingJourneyRollupStore,
    validator: RollingJourneyRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingJourneyRollupEngine,
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
      throw new Error(`rolling journey rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling journey rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling journey rollup ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRollingJourneyRollupWorkflow(store: RollingJourneyRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingJourneyRollupWorkflow {
  return new RollingJourneyRollupWorkflow(
    store,
    defaultRollingJourneyRollupValidator(),
    clockValue,
    [],
    defaultRollingJourneyRollupEngine(flagsValue),
  );
}
