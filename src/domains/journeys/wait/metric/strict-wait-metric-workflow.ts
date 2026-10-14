import * as clock from "../../../../kit/clock.js";
import { StrictWaitMetricEngine, defaultStrictWaitMetricEngine } from "./strict-wait-metric-engine.js";
import { StrictWaitMetricValidator, defaultStrictWaitMetricValidator } from "./strict-wait-metric-rules.js";
import { StrictWaitMetricStore } from "./strict-wait-metric-store.js";

/** Moves strict wait metrics through their life cycle and keeps a journal of what it did. */
export class StrictWaitMetricCoordinator {
  store: StrictWaitMetricStore;
  validator: StrictWaitMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictWaitMetricEngine;

  constructor(
    store: StrictWaitMetricStore,
    validator: StrictWaitMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictWaitMetricEngine,
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
      throw new Error(`strict wait metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict wait metric ${code} not found`);
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
      throw new Error(`strict wait metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictWaitMetricCoordinator(store: StrictWaitMetricStore, clockValue: clock.Clock): StrictWaitMetricCoordinator {
  return new StrictWaitMetricCoordinator(
    store,
    defaultStrictWaitMetricValidator(),
    clockValue,
    [],
    defaultStrictWaitMetricEngine(),
  );
}
