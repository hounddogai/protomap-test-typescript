import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SubscriptionLedgerEngine, defaultSubscriptionLedgerEngine } from "./subscription-ledger-engine.js";
import { SubscriptionLedgerValidator, defaultSubscriptionLedgerValidator } from "./subscription-ledger-rules.js";
import { SubscriptionLedgerStore } from "./subscription-ledger-store.js";

/** Moves subscription ledgers through their life cycle and keeps a journal of what it did. */
export class SubscriptionLedgerCoordinator {
  store: SubscriptionLedgerStore;
  validator: SubscriptionLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionLedgerEngine;

  constructor(
    store: SubscriptionLedgerStore,
    validator: SubscriptionLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionLedgerEngine,
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
      throw new Error(`subscription ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription ledger ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSubscriptionLedgerCoordinator(store: SubscriptionLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionLedgerCoordinator {
  return new SubscriptionLedgerCoordinator(
    store,
    defaultSubscriptionLedgerValidator(),
    clockValue,
    [],
    defaultSubscriptionLedgerEngine(flagsValue),
  );
}
