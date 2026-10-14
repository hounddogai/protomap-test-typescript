import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictQueueVarianceEngine, defaultStrictQueueVarianceEngine } from "./strict-queue-variance-engine.js";
import { StrictQueueVarianceValidator, defaultStrictQueueVarianceValidator } from "./strict-queue-variance-rules.js";
import { StrictQueueVarianceStore } from "./strict-queue-variance-store.js";

/** Moves strict queue variances through their life cycle and keeps a journal of what it did. */
export class StrictQueueVarianceService {
  store: StrictQueueVarianceStore;
  validator: StrictQueueVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictQueueVarianceEngine;

  constructor(
    store: StrictQueueVarianceStore,
    validator: StrictQueueVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictQueueVarianceEngine,
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
      throw new Error(`strict queue variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict queue variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict queue variance ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictQueueVarianceService(store: StrictQueueVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictQueueVarianceService {
  return new StrictQueueVarianceService(
    store,
    defaultStrictQueueVarianceValidator(),
    clockValue,
    [],
    defaultStrictQueueVarianceEngine(flagsValue),
  );
}
