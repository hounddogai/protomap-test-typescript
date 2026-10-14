import * as clock from "../../../../kit/clock.js";
import { FraudCheckMetricEngine, defaultFraudCheckMetricEngine } from "./fraud-check-metric-engine.js";
import { FraudCheckMetricValidator, defaultFraudCheckMetricValidator } from "./fraud-check-metric-rules.js";
import { FraudCheckMetricStore } from "./fraud-check-metric-store.js";

/** Moves fraud check metrics through their life cycle and keeps a journal of what it did. */
export class FraudCheckMetricCoordinator {
  store: FraudCheckMetricStore;
  validator: FraudCheckMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckMetricEngine;

  constructor(
    store: FraudCheckMetricStore,
    validator: FraudCheckMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckMetricEngine,
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
      throw new Error(`fraud check metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check metric ${code} not found`);
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

export function newFraudCheckMetricCoordinator(store: FraudCheckMetricStore, clockValue: clock.Clock): FraudCheckMetricCoordinator {
  return new FraudCheckMetricCoordinator(
    store,
    defaultFraudCheckMetricValidator(),
    clockValue,
    [],
    defaultFraudCheckMetricEngine(),
  );
}
