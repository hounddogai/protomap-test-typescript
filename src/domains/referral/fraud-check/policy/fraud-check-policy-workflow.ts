import * as clock from "../../../../kit/clock.js";
import { FraudCheckPolicyEngine, defaultFraudCheckPolicyEngine } from "./fraud-check-policy-engine.js";
import { FraudCheckPolicyValidator, defaultFraudCheckPolicyValidator } from "./fraud-check-policy-rules.js";
import { FraudCheckPolicyStore } from "./fraud-check-policy-store.js";

/** Moves fraud check policies through their life cycle and keeps a journal of what it did. */
export class FraudCheckPolicyWorkflow {
  store: FraudCheckPolicyStore;
  validator: FraudCheckPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckPolicyEngine;

  constructor(
    store: FraudCheckPolicyStore,
    validator: FraudCheckPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckPolicyEngine,
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
      throw new Error(`fraud check policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check policy ${code} not found`);
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
      throw new Error(`fraud check policy ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newFraudCheckPolicyWorkflow(store: FraudCheckPolicyStore, clockValue: clock.Clock): FraudCheckPolicyWorkflow {
  return new FraudCheckPolicyWorkflow(
    store,
    defaultFraudCheckPolicyValidator(),
    clockValue,
    [],
    defaultFraudCheckPolicyEngine(),
  );
}
