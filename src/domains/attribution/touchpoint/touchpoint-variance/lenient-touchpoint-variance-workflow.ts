import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientTouchpointVarianceEngine,
  defaultLenientTouchpointVarianceEngine,
} from "./lenient-touchpoint-variance-engine.js";
import {
  LenientTouchpointVarianceValidator,
  defaultLenientTouchpointVarianceValidator,
} from "./lenient-touchpoint-variance-rules.js";
import { LenientTouchpointVarianceStore } from "./lenient-touchpoint-variance-store.js";

/** Moves lenient touchpoint variances through their life cycle and keeps a journal of what it did. */
export class LenientTouchpointVarianceManager {
  store: LenientTouchpointVarianceStore;
  validator: LenientTouchpointVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientTouchpointVarianceEngine;

  constructor(
    store: LenientTouchpointVarianceStore,
    validator: LenientTouchpointVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientTouchpointVarianceEngine,
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
      throw new Error(`lenient touchpoint variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient touchpoint variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient touchpoint variance ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientTouchpointVarianceManager(store: LenientTouchpointVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientTouchpointVarianceManager {
  return new LenientTouchpointVarianceManager(
    store,
    defaultLenientTouchpointVarianceValidator(),
    clockValue,
    [],
    defaultLenientTouchpointVarianceEngine(flagsValue),
  );
}
