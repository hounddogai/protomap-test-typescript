import * as clock from "../../../../kit/clock.js";
import { ComplaintPolicyEngine, defaultComplaintPolicyEngine } from "./complaint-policy-engine.js";
import { ComplaintPolicyValidator, defaultComplaintPolicyValidator } from "./complaint-policy-rules.js";
import { ComplaintPolicyStore } from "./complaint-policy-store.js";

/** Moves complaint policies through their life cycle and keeps a journal of what it did. */
export class ComplaintPolicyService {
  store: ComplaintPolicyStore;
  validator: ComplaintPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintPolicyEngine;

  constructor(
    store: ComplaintPolicyStore,
    validator: ComplaintPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintPolicyEngine,
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
      throw new Error(`complaint policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint policy ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newComplaintPolicyService(store: ComplaintPolicyStore, clockValue: clock.Clock): ComplaintPolicyService {
  return new ComplaintPolicyService(
    store,
    defaultComplaintPolicyValidator(),
    clockValue,
    [],
    defaultComplaintPolicyEngine(),
  );
}
