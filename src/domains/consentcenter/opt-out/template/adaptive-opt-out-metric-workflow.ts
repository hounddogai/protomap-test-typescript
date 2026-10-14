import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveOptOutMetricEngine, defaultAdaptiveOptOutMetricEngine } from "./adaptive-opt-out-metric-engine.js";
import {
  AdaptiveOptOutMetricValidator,
  defaultAdaptiveOptOutMetricValidator,
} from "./adaptive-opt-out-metric-rules.js";
import { AdaptiveOptOutMetricStore } from "./adaptive-opt-out-metric-store.js";

/** Moves adaptive opt out metrics through their life cycle and keeps a journal of what it did. */
export class AdaptiveOptOutMetricService {
  store: AdaptiveOptOutMetricStore;
  validator: AdaptiveOptOutMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveOptOutMetricEngine;

  constructor(
    store: AdaptiveOptOutMetricStore,
    validator: AdaptiveOptOutMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveOptOutMetricEngine,
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
      throw new Error(`adaptive opt out metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive opt out metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive opt out metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newAdaptiveOptOutMetricService(store: AdaptiveOptOutMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveOptOutMetricService {
  return new AdaptiveOptOutMetricService(
    store,
    defaultAdaptiveOptOutMetricValidator(),
    clockValue,
    [],
    defaultAdaptiveOptOutMetricEngine(flagsValue),
  );
}
