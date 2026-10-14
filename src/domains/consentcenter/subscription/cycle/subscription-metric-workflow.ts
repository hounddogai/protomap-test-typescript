import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SubscriptionMetricEngine, defaultSubscriptionMetricEngine } from "./subscription-metric-engine.js";
import { SubscriptionMetricValidator, defaultSubscriptionMetricValidator } from "./subscription-metric-rules.js";
import { SubscriptionMetricStore } from "./subscription-metric-store.js";

/** Moves subscription metrics through their life cycle and keeps a journal of what it did. */
export class SubscriptionMetricWorkflow {
  store: SubscriptionMetricStore;
  validator: SubscriptionMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionMetricEngine;

  constructor(
    store: SubscriptionMetricStore,
    validator: SubscriptionMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionMetricEngine,
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
      throw new Error(`subscription metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription metric ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSubscriptionMetricWorkflow(store: SubscriptionMetricStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionMetricWorkflow {
  return new SubscriptionMetricWorkflow(
    store,
    defaultSubscriptionMetricValidator(),
    clockValue,
    [],
    defaultSubscriptionMetricEngine(flagsValue),
  );
}
