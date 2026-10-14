import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingThresholdEngine, defaultPacingThresholdEngine } from "./pacing-threshold-engine.js";
import { PacingThresholdValidator, defaultPacingThresholdValidator } from "./pacing-threshold-rules.js";
import { PacingThresholdStore } from "./pacing-threshold-store.js";

/** Moves pacing thresholds through their life cycle and keeps a journal of what it did. */
export class PacingThresholdCoordinator {
  store: PacingThresholdStore;
  validator: PacingThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingThresholdEngine;

  constructor(
    store: PacingThresholdStore,
    validator: PacingThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingThresholdEngine,
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
      throw new Error(`pacing threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing threshold ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPacingThresholdCoordinator(store: PacingThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingThresholdCoordinator {
  return new PacingThresholdCoordinator(
    store,
    defaultPacingThresholdValidator(),
    clockValue,
    [],
    defaultPacingThresholdEngine(flagsValue),
  );
}
