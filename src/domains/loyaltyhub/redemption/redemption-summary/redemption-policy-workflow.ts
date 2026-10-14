import * as clock from "../../../../kit/clock.js";
import { RedemptionPolicyEngine, defaultRedemptionPolicyEngine } from "./redemption-policy-engine.js";
import { RedemptionPolicyValidator, defaultRedemptionPolicyValidator } from "./redemption-policy-rules.js";
import { RedemptionPolicyStore } from "./redemption-policy-store.js";

/** Moves redemption policies through their life cycle and keeps a journal of what it did. */
export class RedemptionPolicyCoordinator {
  store: RedemptionPolicyStore;
  validator: RedemptionPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionPolicyEngine;

  constructor(
    store: RedemptionPolicyStore,
    validator: RedemptionPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionPolicyEngine,
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
      throw new Error(`redemption policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption policy ${code} not found`);
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

export function newRedemptionPolicyCoordinator(store: RedemptionPolicyStore, clockValue: clock.Clock): RedemptionPolicyCoordinator {
  return new RedemptionPolicyCoordinator(
    store,
    defaultRedemptionPolicyValidator(),
    clockValue,
    [],
    defaultRedemptionPolicyEngine(),
  );
}
