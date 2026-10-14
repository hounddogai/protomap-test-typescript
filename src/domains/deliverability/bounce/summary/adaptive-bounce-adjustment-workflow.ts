import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveBounceAdjustmentEngine,
  defaultAdaptiveBounceAdjustmentEngine,
} from "./adaptive-bounce-adjustment-engine.js";
import {
  AdaptiveBounceAdjustmentValidator,
  defaultAdaptiveBounceAdjustmentValidator,
} from "./adaptive-bounce-adjustment-rules.js";
import { AdaptiveBounceAdjustmentStore } from "./adaptive-bounce-adjustment-store.js";

/** Moves adaptive bounce adjustments through their life cycle and keeps a journal of what it did. */
export class AdaptiveBounceAdjustmentDesk {
  store: AdaptiveBounceAdjustmentStore;
  validator: AdaptiveBounceAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveBounceAdjustmentEngine;

  constructor(
    store: AdaptiveBounceAdjustmentStore,
    validator: AdaptiveBounceAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveBounceAdjustmentEngine,
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
      throw new Error(`adaptive bounce adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive bounce adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive bounce adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveBounceAdjustmentDesk(store: AdaptiveBounceAdjustmentStore, clockValue: clock.Clock): AdaptiveBounceAdjustmentDesk {
  return new AdaptiveBounceAdjustmentDesk(
    store,
    defaultAdaptiveBounceAdjustmentValidator(),
    clockValue,
    [],
    defaultAdaptiveBounceAdjustmentEngine(),
  );
}
