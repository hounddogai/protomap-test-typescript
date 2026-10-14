import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  StrictConversionAdjustmentEngine,
  defaultStrictConversionAdjustmentEngine,
} from "./strict-conversion-adjustment-engine.js";
import {
  StrictConversionAdjustmentValidator,
  defaultStrictConversionAdjustmentValidator,
} from "./strict-conversion-adjustment-rules.js";
import { StrictConversionAdjustmentStore } from "./strict-conversion-adjustment-store.js";

/** Moves strict conversion adjustments through their life cycle and keeps a journal of what it did. */
export class StrictConversionAdjustmentDesk {
  store: StrictConversionAdjustmentStore;
  validator: StrictConversionAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictConversionAdjustmentEngine;

  constructor(
    store: StrictConversionAdjustmentStore,
    validator: StrictConversionAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictConversionAdjustmentEngine,
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
      throw new Error(`strict conversion adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict conversion adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict conversion adjustment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newStrictConversionAdjustmentDesk(store: StrictConversionAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictConversionAdjustmentDesk {
  return new StrictConversionAdjustmentDesk(
    store,
    defaultStrictConversionAdjustmentValidator(),
    clockValue,
    [],
    defaultStrictConversionAdjustmentEngine(flagsValue),
  );
}
