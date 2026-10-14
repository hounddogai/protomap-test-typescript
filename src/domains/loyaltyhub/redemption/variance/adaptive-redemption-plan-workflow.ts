import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveRedemptionPlanEngine,
  defaultAdaptiveRedemptionPlanEngine,
} from "./adaptive-redemption-plan-engine.js";
import {
  AdaptiveRedemptionPlanValidator,
  defaultAdaptiveRedemptionPlanValidator,
} from "./adaptive-redemption-plan-rules.js";
import { AdaptiveRedemptionPlanStore } from "./adaptive-redemption-plan-store.js";

/** Moves adaptive redemption plans through their life cycle and keeps a journal of what it did. */
export class AdaptiveRedemptionPlanManager {
  store: AdaptiveRedemptionPlanStore;
  validator: AdaptiveRedemptionPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveRedemptionPlanEngine;

  constructor(
    store: AdaptiveRedemptionPlanStore,
    validator: AdaptiveRedemptionPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveRedemptionPlanEngine,
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
      throw new Error(`adaptive redemption plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive redemption plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive redemption plan ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveRedemptionPlanManager(store: AdaptiveRedemptionPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveRedemptionPlanManager {
  return new AdaptiveRedemptionPlanManager(
    store,
    defaultAdaptiveRedemptionPlanValidator(),
    clockValue,
    [],
    defaultAdaptiveRedemptionPlanEngine(flagsValue),
  );
}
