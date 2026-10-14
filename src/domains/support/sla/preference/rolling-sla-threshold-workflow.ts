import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingSlaThresholdEngine, defaultRollingSlaThresholdEngine } from "./rolling-sla-threshold-engine.js";
import { RollingSlaThresholdValidator, defaultRollingSlaThresholdValidator } from "./rolling-sla-threshold-rules.js";
import { RollingSlaThresholdStore } from "./rolling-sla-threshold-store.js";

/** Moves rolling sla thresholds through their life cycle and keeps a journal of what it did. */
export class RollingSlaThresholdDesk {
  store: RollingSlaThresholdStore;
  validator: RollingSlaThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingSlaThresholdEngine;

  constructor(
    store: RollingSlaThresholdStore,
    validator: RollingSlaThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingSlaThresholdEngine,
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
      throw new Error(`rolling sla threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling sla threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling sla threshold ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingSlaThresholdDesk(store: RollingSlaThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingSlaThresholdDesk {
  return new RollingSlaThresholdDesk(
    store,
    defaultRollingSlaThresholdValidator(),
    clockValue,
    [],
    defaultRollingSlaThresholdEngine(flagsValue),
  );
}
