import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimaryRedemptionVarianceEngine,
  defaultPrimaryRedemptionVarianceEngine,
} from "./primary-redemption-variance-engine.js";
import {
  PrimaryRedemptionVarianceValidator,
  defaultPrimaryRedemptionVarianceValidator,
} from "./primary-redemption-variance-rules.js";
import { PrimaryRedemptionVarianceStore } from "./primary-redemption-variance-store.js";

/** Moves primary redemption variances through their life cycle and keeps a journal of what it did. */
export class PrimaryRedemptionVarianceCoordinator {
  store: PrimaryRedemptionVarianceStore;
  validator: PrimaryRedemptionVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryRedemptionVarianceEngine;

  constructor(
    store: PrimaryRedemptionVarianceStore,
    validator: PrimaryRedemptionVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryRedemptionVarianceEngine,
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
      throw new Error(`primary redemption variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary redemption variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary redemption variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPrimaryRedemptionVarianceCoordinator(store: PrimaryRedemptionVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryRedemptionVarianceCoordinator {
  return new PrimaryRedemptionVarianceCoordinator(
    store,
    defaultPrimaryRedemptionVarianceValidator(),
    clockValue,
    [],
    defaultPrimaryRedemptionVarianceEngine(flagsValue),
  );
}
