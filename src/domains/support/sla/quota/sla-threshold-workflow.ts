import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SlaThresholdEngine, defaultSlaThresholdEngine } from "./sla-threshold-engine.js";
import { SlaThresholdValidator, defaultSlaThresholdValidator } from "./sla-threshold-rules.js";
import { SlaThresholdStore } from "./sla-threshold-store.js";

/** Moves sla thresholds through their life cycle and keeps a journal of what it did. */
export class SlaThresholdWorkflow {
  store: SlaThresholdStore;
  validator: SlaThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaThresholdEngine;

  constructor(
    store: SlaThresholdStore,
    validator: SlaThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaThresholdEngine,
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
      throw new Error(`sla threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla threshold ${code} not found`);
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

export function newSlaThresholdWorkflow(store: SlaThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): SlaThresholdWorkflow {
  return new SlaThresholdWorkflow(
    store,
    defaultSlaThresholdValidator(),
    clockValue,
    [],
    defaultSlaThresholdEngine(flagsValue),
  );
}
