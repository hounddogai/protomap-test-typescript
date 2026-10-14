import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptivePreferencePolicyEngine,
  defaultAdaptivePreferencePolicyEngine,
} from "./adaptive-preference-policy-engine.js";
import {
  AdaptivePreferencePolicyValidator,
  defaultAdaptivePreferencePolicyValidator,
} from "./adaptive-preference-policy-rules.js";
import { AdaptivePreferencePolicyStore } from "./adaptive-preference-policy-store.js";

/** Moves adaptive preference policies through their life cycle and keeps a journal of what it did. */
export class AdaptivePreferencePolicyWorkflow {
  store: AdaptivePreferencePolicyStore;
  validator: AdaptivePreferencePolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePreferencePolicyEngine;

  constructor(
    store: AdaptivePreferencePolicyStore,
    validator: AdaptivePreferencePolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePreferencePolicyEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive preference policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive preference policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive preference policy ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptivePreferencePolicyWorkflow(store: AdaptivePreferencePolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptivePreferencePolicyWorkflow {
  return new AdaptivePreferencePolicyWorkflow(
    store,
    defaultAdaptivePreferencePolicyValidator(),
    clockValue,
    [],
    defaultAdaptivePreferencePolicyEngine(flagsValue),
  );
}
