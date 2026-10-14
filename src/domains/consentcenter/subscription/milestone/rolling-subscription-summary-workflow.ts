import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingSubscriptionSummaryEngine,
  defaultRollingSubscriptionSummaryEngine,
} from "./rolling-subscription-summary-engine.js";
import {
  RollingSubscriptionSummaryValidator,
  defaultRollingSubscriptionSummaryValidator,
} from "./rolling-subscription-summary-rules.js";
import { RollingSubscriptionSummaryStore } from "./rolling-subscription-summary-store.js";

/** Moves rolling subscription summaries through their life cycle and keeps a journal of what it did. */
export class RollingSubscriptionSummaryManager {
  store: RollingSubscriptionSummaryStore;
  validator: RollingSubscriptionSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingSubscriptionSummaryEngine;

  constructor(
    store: RollingSubscriptionSummaryStore,
    validator: RollingSubscriptionSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingSubscriptionSummaryEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling subscription summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling subscription summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling subscription summary ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRollingSubscriptionSummaryManager(store: RollingSubscriptionSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingSubscriptionSummaryManager {
  return new RollingSubscriptionSummaryManager(
    store,
    defaultRollingSubscriptionSummaryValidator(),
    clockValue,
    [],
    defaultRollingSubscriptionSummaryEngine(flagsValue),
  );
}
