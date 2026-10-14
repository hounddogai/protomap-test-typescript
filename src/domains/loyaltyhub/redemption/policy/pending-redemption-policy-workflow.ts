import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingRedemptionPolicyEngine,
  defaultPendingRedemptionPolicyEngine,
} from "./pending-redemption-policy-engine.js";
import {
  PendingRedemptionPolicyValidator,
  defaultPendingRedemptionPolicyValidator,
} from "./pending-redemption-policy-rules.js";
import { PendingRedemptionPolicyStore } from "./pending-redemption-policy-store.js";

/** Moves pending redemption policies through their life cycle and keeps a journal of what it did. */
export class PendingRedemptionPolicyWorkflow {
  store: PendingRedemptionPolicyStore;
  validator: PendingRedemptionPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingRedemptionPolicyEngine;

  constructor(
    store: PendingRedemptionPolicyStore,
    validator: PendingRedemptionPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingRedemptionPolicyEngine,
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
      throw new Error(`pending redemption policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending redemption policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending redemption policy ${code} not found`);
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

export function newPendingRedemptionPolicyWorkflow(store: PendingRedemptionPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingRedemptionPolicyWorkflow {
  return new PendingRedemptionPolicyWorkflow(
    store,
    defaultPendingRedemptionPolicyValidator(),
    clockValue,
    [],
    defaultPendingRedemptionPolicyEngine(flagsValue),
  );
}
