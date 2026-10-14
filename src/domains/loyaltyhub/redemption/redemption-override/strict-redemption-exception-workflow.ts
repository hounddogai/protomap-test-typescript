import * as clock from "../../../../kit/clock.js";
import {
  StrictRedemptionExceptionEngine,
  defaultStrictRedemptionExceptionEngine,
} from "./strict-redemption-exception-engine.js";
import {
  StrictRedemptionExceptionValidator,
  defaultStrictRedemptionExceptionValidator,
} from "./strict-redemption-exception-rules.js";
import { StrictRedemptionExceptionStore } from "./strict-redemption-exception-store.js";

/** Moves strict redemption exceptions through their life cycle and keeps a journal of what it did. */
export class StrictRedemptionExceptionDesk {
  store: StrictRedemptionExceptionStore;
  validator: StrictRedemptionExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictRedemptionExceptionEngine;

  constructor(
    store: StrictRedemptionExceptionStore,
    validator: StrictRedemptionExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictRedemptionExceptionEngine,
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
      throw new Error(`strict redemption exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict redemption exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict redemption exception ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newStrictRedemptionExceptionDesk(store: StrictRedemptionExceptionStore, clockValue: clock.Clock): StrictRedemptionExceptionDesk {
  return new StrictRedemptionExceptionDesk(
    store,
    defaultStrictRedemptionExceptionValidator(),
    clockValue,
    [],
    defaultStrictRedemptionExceptionEngine(),
  );
}
