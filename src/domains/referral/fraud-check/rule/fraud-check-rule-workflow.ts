import * as clock from "../../../../kit/clock.js";
import { FraudCheckRuleEngine, defaultFraudCheckRuleEngine } from "./fraud-check-rule-engine.js";
import { FraudCheckRuleValidator, defaultFraudCheckRuleValidator } from "./fraud-check-rule-rules.js";
import { FraudCheckRuleStore } from "./fraud-check-rule-store.js";

/** Moves fraud check rules through their life cycle and keeps a journal of what it did. */
export class FraudCheckRuleWorkflow {
  store: FraudCheckRuleStore;
  validator: FraudCheckRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckRuleEngine;

  constructor(
    store: FraudCheckRuleStore,
    validator: FraudCheckRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckRuleEngine,
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
      throw new Error(`fraud check rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check rule ${code} not found`);
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
      throw new Error(`fraud check rule ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newFraudCheckRuleWorkflow(store: FraudCheckRuleStore, clockValue: clock.Clock): FraudCheckRuleWorkflow {
  return new FraudCheckRuleWorkflow(
    store,
    defaultFraudCheckRuleValidator(),
    clockValue,
    [],
    defaultFraudCheckRuleEngine(),
  );
}
