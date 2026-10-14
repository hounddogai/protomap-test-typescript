import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PaywallSnapshotEngine, defaultPaywallSnapshotEngine } from "./paywall-snapshot-engine.js";
import { PaywallSnapshotValidator, defaultPaywallSnapshotValidator } from "./paywall-snapshot-rules.js";
import { PaywallSnapshotStore } from "./paywall-snapshot-store.js";

/** Moves paywall snapshots through their life cycle and keeps a journal of what it did. */
export class PaywallSnapshotCoordinator {
  store: PaywallSnapshotStore;
  validator: PaywallSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallSnapshotEngine;

  constructor(
    store: PaywallSnapshotStore,
    validator: PaywallSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallSnapshotEngine,
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
      throw new Error(`paywall snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall snapshot ${code} not found`);
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
      throw new Error(`paywall snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPaywallSnapshotCoordinator(store: PaywallSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): PaywallSnapshotCoordinator {
  return new PaywallSnapshotCoordinator(
    store,
    defaultPaywallSnapshotValidator(),
    clockValue,
    [],
    defaultPaywallSnapshotEngine(flagsValue),
  );
}
