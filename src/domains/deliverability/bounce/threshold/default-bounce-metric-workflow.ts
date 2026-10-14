import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultBounceMetricEngine, defaultDefaultBounceMetricEngine } from "./default-bounce-metric-engine.js";
import {
  DefaultBounceMetricValidatorExtra,
  defaultDefaultBounceMetricValidator,
} from "./default-bounce-metric-rules.js";
import { DefaultBounceMetricStore } from "./default-bounce-metric-store.js";

/** Moves default bounce metrics through their life cycle and keeps a journal of what it did. */
export class DefaultBounceMetricDesk {
  store: DefaultBounceMetricStore;
  validator: DefaultBounceMetricValidatorExtra;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultBounceMetricEngine;

  constructor(
    store: DefaultBounceMetricStore,
    validator: DefaultBounceMetricValidatorExtra,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultBounceMetricEngine,
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
      throw new Error(`default bounce metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default bounce metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default bounce metric ${code} not found`);
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

export function newDefaultBounceMetricDesk(store: DefaultBounceMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultBounceMetricDesk {
  return new DefaultBounceMetricDesk(
    store,
    defaultDefaultBounceMetricValidator(),
    clockValue,
    [],
    defaultDefaultBounceMetricEngine(flagsValue),
  );
}
