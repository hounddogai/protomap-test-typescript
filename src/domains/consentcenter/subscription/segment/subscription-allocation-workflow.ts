import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SubscriptionAllocationEngine,
  defaultSubscriptionAllocationEngine,
} from "./subscription-allocation-engine.js";
import {
  SubscriptionAllocationValidator,
  defaultSubscriptionAllocationValidator,
} from "./subscription-allocation-rules.js";
import { SubscriptionAllocationStore } from "./subscription-allocation-store.js";

/** Moves subscription allocations through their life cycle and keeps a journal of what it did. */
export class SubscriptionAllocationService {
  store: SubscriptionAllocationStore;
  validator: SubscriptionAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionAllocationEngine;

  constructor(
    store: SubscriptionAllocationStore,
    validator: SubscriptionAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionAllocationEngine,
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
      throw new Error(`subscription allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription allocation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSubscriptionAllocationService(store: SubscriptionAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionAllocationService {
  return new SubscriptionAllocationService(
    store,
    defaultSubscriptionAllocationValidator(),
    clockValue,
    [],
    defaultSubscriptionAllocationEngine(flagsValue),
  );
}
