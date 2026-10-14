import * as clock from "../../../../kit/clock.js";
import {
  LenientActivationMetricEngine,
  defaultLenientActivationMetricEngine,
} from "./lenient-activation-metric-engine.js";
import {
  LenientActivationMetricValidator,
  defaultLenientActivationMetricValidator,
} from "./lenient-activation-metric-rules.js";
import { LenientActivationMetricStore } from "./lenient-activation-metric-store.js";

/** Moves lenient activation metrics through their life cycle and keeps a journal of what it did. */
export class LenientActivationMetricCoordinator {
  store: LenientActivationMetricStore;
  validator: LenientActivationMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientActivationMetricEngine;

  constructor(
    store: LenientActivationMetricStore,
    validator: LenientActivationMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientActivationMetricEngine,
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
      throw new Error(`lenient activation metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient activation metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient activation metric ${code} not found`);
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

export function newLenientActivationMetricCoordinator(store: LenientActivationMetricStore, clockValue: clock.Clock): LenientActivationMetricCoordinator {
  return new LenientActivationMetricCoordinator(
    store,
    defaultLenientActivationMetricValidator(),
    clockValue,
    [],
    defaultLenientActivationMetricEngine(),
  );
}
