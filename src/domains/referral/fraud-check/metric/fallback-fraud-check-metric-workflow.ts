import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackFraudCheckMetricEngine,
  defaultFallbackFraudCheckMetricEngine,
} from "./fallback-fraud-check-metric-engine.js";
import {
  FallbackFraudCheckMetricValidator,
  defaultFallbackFraudCheckMetricValidator,
} from "./fallback-fraud-check-metric-rules.js";
import { FallbackFraudCheckMetricStore } from "./fallback-fraud-check-metric-store.js";

/** Moves fallback fraud check metrics through their life cycle and keeps a journal of what it did. */
export class FallbackFraudCheckMetricCoordinator {
  store: FallbackFraudCheckMetricStore;
  validator: FallbackFraudCheckMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackFraudCheckMetricEngine;

  constructor(
    store: FallbackFraudCheckMetricStore,
    validator: FallbackFraudCheckMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackFraudCheckMetricEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback fraud check metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback fraud check metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback fraud check metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFallbackFraudCheckMetricCoordinator(store: FallbackFraudCheckMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackFraudCheckMetricCoordinator {
  return new FallbackFraudCheckMetricCoordinator(
    store,
    defaultFallbackFraudCheckMetricValidator(),
    clockValue,
    [],
    defaultFallbackFraudCheckMetricEngine(flagsValue),
  );
}
