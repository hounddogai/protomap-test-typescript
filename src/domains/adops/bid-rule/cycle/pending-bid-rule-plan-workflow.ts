import * as clock from "../../../../kit/clock.js";
import { PendingBidRulePlanEngine, defaultPendingBidRulePlanEngine } from "./pending-bid-rule-plan-engine.js";
import { PendingBidRulePlanValidator, defaultPendingBidRulePlanValidator } from "./pending-bid-rule-plan-rules.js";
import { PendingBidRulePlanStore } from "./pending-bid-rule-plan-store.js";

/** Moves pending bid rule plans through their life cycle and keeps a journal of what it did. */
export class PendingBidRulePlanManager {
  store: PendingBidRulePlanStore;
  validator: PendingBidRulePlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBidRulePlanEngine;

  constructor(
    store: PendingBidRulePlanStore,
    validator: PendingBidRulePlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBidRulePlanEngine,
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
      throw new Error(`pending bid rule plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule plan ${code} not found`);
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
      throw new Error(`pending bid rule plan ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPendingBidRulePlanManager(store: PendingBidRulePlanStore, clockValue: clock.Clock): PendingBidRulePlanManager {
  return new PendingBidRulePlanManager(
    store,
    defaultPendingBidRulePlanValidator(),
    clockValue,
    [],
    defaultPendingBidRulePlanEngine(),
  );
}
