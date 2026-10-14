import * as clock from "../../../../kit/clock.js";
import { PaywallWindowEngine, defaultPaywallWindowEngine } from "./paywall-window-engine.js";
import { PaywallWindowValidator, defaultPaywallWindowValidator } from "./paywall-window-rules.js";
import { PaywallWindowStore } from "./paywall-window-store.js";

/** Moves paywall windows through their life cycle and keeps a journal of what it did. */
export class PaywallWindowWorkflow {
  store: PaywallWindowStore;
  validator: PaywallWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallWindowEngine;

  constructor(
    store: PaywallWindowStore,
    validator: PaywallWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallWindowEngine,
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
      throw new Error(`paywall window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall window ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPaywallWindowWorkflow(store: PaywallWindowStore, clockValue: clock.Clock): PaywallWindowWorkflow {
  return new PaywallWindowWorkflow(
    store,
    defaultPaywallWindowValidator(),
    clockValue,
    [],
    defaultPaywallWindowEngine(),
  );
}
