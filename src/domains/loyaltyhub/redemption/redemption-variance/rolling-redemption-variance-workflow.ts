import * as clock from "../../../../kit/clock.js";
import {
  RollingRedemptionVarianceEngine,
  defaultRollingRedemptionVarianceEngine,
} from "./rolling-redemption-variance-engine.js";
import {
  RollingRedemptionVarianceValidator,
  defaultRollingRedemptionVarianceValidator,
} from "./rolling-redemption-variance-rules.js";
import { RollingRedemptionVarianceStore } from "./rolling-redemption-variance-store.js";

/** Moves rolling redemption variances through their life cycle and keeps a journal of what it did. */
export class RollingRedemptionVarianceDesk {
  store: RollingRedemptionVarianceStore;
  validator: RollingRedemptionVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingRedemptionVarianceEngine;

  constructor(
    store: RollingRedemptionVarianceStore,
    validator: RollingRedemptionVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingRedemptionVarianceEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling redemption variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling redemption variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling redemption variance ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRollingRedemptionVarianceDesk(store: RollingRedemptionVarianceStore, clockValue: clock.Clock): RollingRedemptionVarianceDesk {
  return new RollingRedemptionVarianceDesk(
    store,
    defaultRollingRedemptionVarianceValidator(),
    clockValue,
    [],
    defaultRollingRedemptionVarianceEngine(),
  );
}
