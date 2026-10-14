import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BranchThresholdEngine, defaultBranchThresholdEngine } from "./branch-threshold-engine.js";
import { BranchThresholdValidator, defaultBranchThresholdValidator } from "./branch-threshold-rules.js";
import { BranchThresholdStore } from "./branch-threshold-store.js";

/** Moves branch thresholds through their life cycle and keeps a journal of what it did. */
export class BranchThresholdCoordinator {
  store: BranchThresholdStore;
  validator: BranchThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchThresholdEngine;

  constructor(
    store: BranchThresholdStore,
    validator: BranchThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchThresholdEngine,
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
      throw new Error(`branch threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch threshold ${code} not found`);
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
      throw new Error(`branch threshold ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newBranchThresholdCoordinator(store: BranchThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): BranchThresholdCoordinator {
  return new BranchThresholdCoordinator(
    store,
    defaultBranchThresholdValidator(),
    clockValue,
    [],
    defaultBranchThresholdEngine(flagsValue),
  );
}
