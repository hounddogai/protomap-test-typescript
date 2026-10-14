import * as clock from "../../../../kit/clock.js";
import { StrictFrequencyPolicyEngine, defaultStrictFrequencyPolicyEngine } from "./strict-frequency-policy-engine.js";
import {
  StrictFrequencyPolicyValidator,
  defaultStrictFrequencyPolicyValidator,
} from "./strict-frequency-policy-rules.js";
import { StrictFrequencyPolicyStore } from "./strict-frequency-policy-store.js";

/** Moves strict frequency policies through their life cycle and keeps a journal of what it did. */
export class StrictFrequencyPolicyWorkflow {
  store: StrictFrequencyPolicyStore;
  validator: StrictFrequencyPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictFrequencyPolicyEngine;

  constructor(
    store: StrictFrequencyPolicyStore,
    validator: StrictFrequencyPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictFrequencyPolicyEngine,
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
      throw new Error(`strict frequency policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict frequency policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict frequency policy ${code} not found`);
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

export function newStrictFrequencyPolicyWorkflow(store: StrictFrequencyPolicyStore, clockValue: clock.Clock): StrictFrequencyPolicyWorkflow {
  return new StrictFrequencyPolicyWorkflow(
    store,
    defaultStrictFrequencyPolicyValidator(),
    clockValue,
    [],
    defaultStrictFrequencyPolicyEngine(),
  );
}
