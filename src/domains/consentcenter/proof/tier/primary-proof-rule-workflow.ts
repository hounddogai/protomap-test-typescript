import * as clock from "../../../../kit/clock.js";
import { PrimaryProofRuleEngine, defaultPrimaryProofRuleEngine } from "./primary-proof-rule-engine.js";
import { PrimaryProofRuleValidator, defaultPrimaryProofRuleValidator } from "./primary-proof-rule-rules.js";
import { PrimaryProofRuleStore } from "./primary-proof-rule-store.js";

/** Moves primary proof rules through their life cycle and keeps a journal of what it did. */
export class PrimaryProofRuleCoordinator {
  store: PrimaryProofRuleStore;
  validator: PrimaryProofRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryProofRuleEngine;

  constructor(
    store: PrimaryProofRuleStore,
    validator: PrimaryProofRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryProofRuleEngine,
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
      throw new Error(`primary proof rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary proof rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary proof rule ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPrimaryProofRuleCoordinator(store: PrimaryProofRuleStore, clockValue: clock.Clock): PrimaryProofRuleCoordinator {
  return new PrimaryProofRuleCoordinator(
    store,
    defaultPrimaryProofRuleValidator(),
    clockValue,
    [],
    defaultPrimaryProofRuleEngine(),
  );
}
