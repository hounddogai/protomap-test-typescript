import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientConversionBatchEngine,
  defaultLenientConversionBatchEngine,
} from "./lenient-conversion-batch-engine.js";
import {
  LenientConversionBatchValidator,
  defaultLenientConversionBatchValidator,
} from "./lenient-conversion-batch-rules.js";
import { LenientConversionBatchStore } from "./lenient-conversion-batch-store.js";

/** Moves lenient conversion batches through their life cycle and keeps a journal of what it did. */
export class LenientConversionBatchCoordinator {
  store: LenientConversionBatchStore;
  validator: LenientConversionBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientConversionBatchEngine;

  constructor(
    store: LenientConversionBatchStore,
    validator: LenientConversionBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientConversionBatchEngine,
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
      throw new Error(`lenient conversion batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient conversion batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient conversion batch ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLenientConversionBatchCoordinator(store: LenientConversionBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientConversionBatchCoordinator {
  return new LenientConversionBatchCoordinator(
    store,
    defaultLenientConversionBatchValidator(),
    clockValue,
    [],
    defaultLenientConversionBatchEngine(flagsValue),
  );
}
