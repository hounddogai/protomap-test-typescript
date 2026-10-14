import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PaywallVarianceEngine, defaultPaywallVarianceEngine } from "./paywall-variance-engine.js";
import { PaywallVarianceValidator, defaultPaywallVarianceValidator } from "./paywall-variance-rules.js";
import { PaywallVarianceStore } from "./paywall-variance-store.js";

/** Moves paywall variances through their life cycle and keeps a journal of what it did. */
export class PaywallVarianceWorkflow {
  store: PaywallVarianceStore;
  validator: PaywallVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallVarianceEngine;

  constructor(
    store: PaywallVarianceStore,
    validator: PaywallVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallVarianceEngine,
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
      throw new Error(`paywall variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPaywallVarianceWorkflow(store: PaywallVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PaywallVarianceWorkflow {
  return new PaywallVarianceWorkflow(
    store,
    defaultPaywallVarianceValidator(),
    clockValue,
    [],
    defaultPaywallVarianceEngine(flagsValue),
  );
}
