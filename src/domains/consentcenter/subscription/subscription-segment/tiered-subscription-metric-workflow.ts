import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredSubscriptionMetricEngine,
  defaultTieredSubscriptionMetricEngine,
} from "./tiered-subscription-metric-engine.js";
import {
  TieredSubscriptionMetricValidator,
  defaultTieredSubscriptionMetricValidator,
} from "./tiered-subscription-metric-rules.js";
import { TieredSubscriptionMetricStore } from "./tiered-subscription-metric-store.js";

/** Moves tiered subscription metrics through their life cycle and keeps a journal of what it did. */
export class TieredSubscriptionMetricDesk {
  store: TieredSubscriptionMetricStore;
  validator: TieredSubscriptionMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredSubscriptionMetricEngine;

  constructor(
    store: TieredSubscriptionMetricStore,
    validator: TieredSubscriptionMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredSubscriptionMetricEngine,
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
      throw new Error(`tiered subscription metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered subscription metric ${code} not found`);
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
      throw new Error(`tiered subscription metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newTieredSubscriptionMetricDesk(store: TieredSubscriptionMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredSubscriptionMetricDesk {
  return new TieredSubscriptionMetricDesk(
    store,
    defaultTieredSubscriptionMetricValidator(),
    clockValue,
    [],
    defaultTieredSubscriptionMetricEngine(flagsValue),
  );
}
