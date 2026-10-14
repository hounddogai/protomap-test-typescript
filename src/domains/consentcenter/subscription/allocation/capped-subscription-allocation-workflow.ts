import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedSubscriptionAllocationEngine,
  defaultCappedSubscriptionAllocationEngine,
} from "./capped-subscription-allocation-engine.js";
import {
  CappedSubscriptionAllocationValidator,
  defaultCappedSubscriptionAllocationValidator,
} from "./capped-subscription-allocation-rules.js";
import { CappedSubscriptionAllocationStore } from "./capped-subscription-allocation-store.js";

/** Moves capped subscription allocations through their life cycle and keeps a journal of what it did. */
export class CappedSubscriptionAllocationDesk {
  store: CappedSubscriptionAllocationStore;
  validator: CappedSubscriptionAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedSubscriptionAllocationEngine;

  constructor(
    store: CappedSubscriptionAllocationStore,
    validator: CappedSubscriptionAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedSubscriptionAllocationEngine,
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
      throw new Error(`capped subscription allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped subscription allocation ${code} not found`);
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
      throw new Error(`capped subscription allocation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newCappedSubscriptionAllocationDesk(store: CappedSubscriptionAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedSubscriptionAllocationDesk {
  return new CappedSubscriptionAllocationDesk(
    store,
    defaultCappedSubscriptionAllocationValidator(),
    clockValue,
    [],
    defaultCappedSubscriptionAllocationEngine(flagsValue),
  );
}
