import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientConversionMetricEngine,
  defaultLenientConversionMetricEngine,
} from "./lenient-conversion-metric-engine.js";
import {
  LenientConversionMetricValidator,
  defaultLenientConversionMetricValidator,
} from "./lenient-conversion-metric-rules.js";
import { LenientConversionMetricStore } from "./lenient-conversion-metric-store.js";

/** Moves lenient conversion metrics through their life cycle and keeps a journal of what it did. */
export class LenientConversionMetricDesk {
  store: LenientConversionMetricStore;
  validator: LenientConversionMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientConversionMetricEngine;

  constructor(
    store: LenientConversionMetricStore,
    validator: LenientConversionMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientConversionMetricEngine,
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
      throw new Error(`lenient conversion metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient conversion metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient conversion metric ${code} not found`);
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

export function newLenientConversionMetricDesk(store: LenientConversionMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientConversionMetricDesk {
  return new LenientConversionMetricDesk(
    store,
    defaultLenientConversionMetricValidator(),
    clockValue,
    [],
    defaultLenientConversionMetricEngine(flagsValue),
  );
}
