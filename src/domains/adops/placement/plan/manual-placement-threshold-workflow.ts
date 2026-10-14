import * as clock from "../../../../kit/clock.js";
import {
  ManualPlacementThresholdEngine,
  defaultManualPlacementThresholdEngine,
} from "./manual-placement-threshold-engine.js";
import {
  ManualPlacementThresholdValidator,
  defaultManualPlacementThresholdValidator,
} from "./manual-placement-threshold-rules.js";
import { ManualPlacementThresholdStore } from "./manual-placement-threshold-store.js";

/** Moves manual placement thresholds through their life cycle and keeps a journal of what it did. */
export class ManualPlacementThresholdService {
  store: ManualPlacementThresholdStore;
  validator: ManualPlacementThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualPlacementThresholdEngine;

  constructor(
    store: ManualPlacementThresholdStore,
    validator: ManualPlacementThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualPlacementThresholdEngine,
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
      throw new Error(`manual placement threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual placement threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual placement threshold ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newManualPlacementThresholdService(store: ManualPlacementThresholdStore, clockValue: clock.Clock): ManualPlacementThresholdService {
  return new ManualPlacementThresholdService(
    store,
    defaultManualPlacementThresholdValidator(),
    clockValue,
    [],
    defaultManualPlacementThresholdEngine(),
  );
}
