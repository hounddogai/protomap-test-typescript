import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingPaywallEntryEngine, defaultPendingPaywallEntryEngine } from "./pending-paywall-entry-engine.js";
import { PendingPaywallEntryValidator, defaultPendingPaywallEntryValidator } from "./pending-paywall-entry-rules.js";
import { PendingPaywallEntryStore } from "./pending-paywall-entry-store.js";

/** Moves pending paywall entries through their life cycle and keeps a journal of what it did. */
export class PendingPaywallEntryWorkflow {
  store: PendingPaywallEntryStore;
  validator: PendingPaywallEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingPaywallEntryEngine;

  constructor(
    store: PendingPaywallEntryStore,
    validator: PendingPaywallEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingPaywallEntryEngine,
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
      throw new Error(`pending paywall entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending paywall entry ${code} not found`);
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
      throw new Error(`pending paywall entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPendingPaywallEntryWorkflow(store: PendingPaywallEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingPaywallEntryWorkflow {
  return new PendingPaywallEntryWorkflow(
    store,
    defaultPendingPaywallEntryValidator(),
    clockValue,
    [],
    defaultPendingPaywallEntryEngine(flagsValue),
  );
}
