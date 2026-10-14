import * as clock from "../../../../kit/clock.js";
import { PaywallThresholdEngine, defaultPaywallThresholdEngine } from "./paywall-threshold-engine.js";
import { PaywallThresholdValidator, defaultPaywallThresholdValidator } from "./paywall-threshold-rules.js";
import { PaywallThresholdStore } from "./paywall-threshold-store.js";

/** Moves paywall thresholds through their life cycle and keeps a journal of what it did. */
export class PaywallThresholdService {
  store: PaywallThresholdStore;
  validator: PaywallThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallThresholdEngine;

  constructor(
    store: PaywallThresholdStore,
    validator: PaywallThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallThresholdEngine,
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
      throw new Error(`paywall threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall threshold ${code} not found`);
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

export function newPaywallThresholdService(store: PaywallThresholdStore, clockValue: clock.Clock): PaywallThresholdService {
  return new PaywallThresholdService(
    store,
    defaultPaywallThresholdValidator(),
    clockValue,
    [],
    defaultPaywallThresholdEngine(),
  );
}
