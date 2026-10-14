import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SubscriptionBatchEngine, defaultSubscriptionBatchEngine } from "./subscription-batch-engine.js";
import { SubscriptionBatchValidator, defaultSubscriptionBatchValidator } from "./subscription-batch-rules.js";
import { SubscriptionBatchStore } from "./subscription-batch-store.js";

/** Moves subscription batches through their life cycle and keeps a journal of what it did. */
export class SubscriptionBatchDesk {
  store: SubscriptionBatchStore;
  validator: SubscriptionBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionBatchEngine;

  constructor(
    store: SubscriptionBatchStore,
    validator: SubscriptionBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionBatchEngine,
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
      throw new Error(`subscription batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription batch ${code} not found`);
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
      throw new Error(`subscription batch ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newSubscriptionBatchDesk(store: SubscriptionBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionBatchDesk {
  return new SubscriptionBatchDesk(
    store,
    defaultSubscriptionBatchValidator(),
    clockValue,
    [],
    defaultSubscriptionBatchEngine(flagsValue),
  );
}
