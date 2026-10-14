import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackComplaintPolicyEngine,
  defaultFallbackComplaintPolicyEngine,
} from "./fallback-complaint-policy-engine.js";
import {
  FallbackComplaintPolicyValidator,
  defaultFallbackComplaintPolicyValidator,
} from "./fallback-complaint-policy-rules.js";
import { FallbackComplaintPolicyStore } from "./fallback-complaint-policy-store.js";

/** Moves fallback complaint policies through their life cycle and keeps a journal of what it did. */
export class FallbackComplaintPolicyManager {
  store: FallbackComplaintPolicyStore;
  validator: FallbackComplaintPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackComplaintPolicyEngine;

  constructor(
    store: FallbackComplaintPolicyStore,
    validator: FallbackComplaintPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackComplaintPolicyEngine,
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
      throw new Error(`fallback complaint policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback complaint policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback complaint policy ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackComplaintPolicyManager(store: FallbackComplaintPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackComplaintPolicyManager {
  return new FallbackComplaintPolicyManager(
    store,
    defaultFallbackComplaintPolicyValidator(),
    clockValue,
    [],
    defaultFallbackComplaintPolicyEngine(flagsValue),
  );
}
