import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ManualSubscriptionBaselineEngine,
  defaultManualSubscriptionBaselineEngine,
} from "./manual-subscription-baseline-engine.js";
import {
  ManualSubscriptionBaselineValidator,
  defaultManualSubscriptionBaselineValidator,
} from "./manual-subscription-baseline-rules.js";
import { ManualSubscriptionBaselineStore } from "./manual-subscription-baseline-store.js";

/** Moves manual subscription baselines through their life cycle and keeps a journal of what it did. */
export class ManualSubscriptionBaselineManager {
  store: ManualSubscriptionBaselineStore;
  validator: ManualSubscriptionBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualSubscriptionBaselineEngine;

  constructor(
    store: ManualSubscriptionBaselineStore,
    validator: ManualSubscriptionBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualSubscriptionBaselineEngine,
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
      throw new Error(`manual subscription baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription baseline ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newManualSubscriptionBaselineManager(store: ManualSubscriptionBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualSubscriptionBaselineManager {
  return new ManualSubscriptionBaselineManager(
    store,
    defaultManualSubscriptionBaselineValidator(),
    clockValue,
    [],
    defaultManualSubscriptionBaselineEngine(flagsValue),
  );
}
