import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledFunnelThresholdEngine,
  defaultScheduledFunnelThresholdEngine,
} from "./scheduled-funnel-threshold-engine.js";
import {
  ScheduledFunnelThresholdValidator,
  defaultScheduledFunnelThresholdValidator,
} from "./scheduled-funnel-threshold-rules.js";
import { ScheduledFunnelThresholdStore } from "./scheduled-funnel-threshold-store.js";

/** Moves scheduled funnel thresholds through their life cycle and keeps a journal of what it did. */
export class ScheduledFunnelThresholdCoordinator {
  store: ScheduledFunnelThresholdStore;
  validator: ScheduledFunnelThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFunnelThresholdEngine;

  constructor(
    store: ScheduledFunnelThresholdStore,
    validator: ScheduledFunnelThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFunnelThresholdEngine,
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
      throw new Error(`scheduled funnel threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled funnel threshold ${code} not found`);
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
      throw new Error(`scheduled funnel threshold ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newScheduledFunnelThresholdCoordinator(store: ScheduledFunnelThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledFunnelThresholdCoordinator {
  return new ScheduledFunnelThresholdCoordinator(
    store,
    defaultScheduledFunnelThresholdValidator(),
    clockValue,
    [],
    defaultScheduledFunnelThresholdEngine(flagsValue),
  );
}
