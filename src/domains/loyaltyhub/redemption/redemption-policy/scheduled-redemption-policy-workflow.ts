import * as clock from "../../../../kit/clock.js";
import {
  ScheduledRedemptionPolicyEngine,
  defaultScheduledRedemptionPolicyEngine,
} from "./scheduled-redemption-policy-engine.js";
import {
  ScheduledRedemptionPolicyValidator,
  defaultScheduledRedemptionPolicyValidator,
} from "./scheduled-redemption-policy-rules.js";
import { ScheduledRedemptionPolicyStore } from "./scheduled-redemption-policy-store.js";

/** Moves scheduled redemption policies through their life cycle and keeps a journal of what it did. */
export class ScheduledRedemptionPolicyService {
  store: ScheduledRedemptionPolicyStore;
  validator: ScheduledRedemptionPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledRedemptionPolicyEngine;

  constructor(
    store: ScheduledRedemptionPolicyStore,
    validator: ScheduledRedemptionPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledRedemptionPolicyEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled redemption policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled redemption policy ${code} not found`);
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
      throw new Error(`scheduled redemption policy ${code} not found`);
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

export function newScheduledRedemptionPolicyService(store: ScheduledRedemptionPolicyStore, clockValue: clock.Clock): ScheduledRedemptionPolicyService {
  return new ScheduledRedemptionPolicyService(
    store,
    defaultScheduledRedemptionPolicyValidator(),
    clockValue,
    [],
    defaultScheduledRedemptionPolicyEngine(),
  );
}
