import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FrequencyPolicyEngine, defaultFrequencyPolicyEngine } from "./frequency-policy-engine.js";
import { FrequencyPolicyValidator, defaultFrequencyPolicyValidator } from "./frequency-policy-rules.js";
import { FrequencyPolicyStore } from "./frequency-policy-store.js";

/** Moves frequency policies through their life cycle and keeps a journal of what it did. */
export class FrequencyPolicyCoordinator {
  store: FrequencyPolicyStore;
  validator: FrequencyPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyPolicyEngine;

  constructor(
    store: FrequencyPolicyStore,
    validator: FrequencyPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyPolicyEngine,
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
      throw new Error(`frequency policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency policy ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFrequencyPolicyCoordinator(store: FrequencyPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): FrequencyPolicyCoordinator {
  return new FrequencyPolicyCoordinator(
    store,
    defaultFrequencyPolicyValidator(),
    clockValue,
    [],
    defaultFrequencyPolicyEngine(flagsValue),
  );
}
