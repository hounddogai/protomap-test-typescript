import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalPaywallSnapshotEngine,
  defaultRegionalPaywallSnapshotEngine,
} from "./regional-paywall-snapshot-engine.js";
import {
  RegionalPaywallSnapshotValidator,
  defaultRegionalPaywallSnapshotValidator,
} from "./regional-paywall-snapshot-rules.js";
import { RegionalPaywallSnapshotStore } from "./regional-paywall-snapshot-store.js";

/** Moves regional paywall snapshots through their life cycle and keeps a journal of what it did. */
export class RegionalPaywallSnapshotDesk {
  store: RegionalPaywallSnapshotStore;
  validator: RegionalPaywallSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalPaywallSnapshotEngine;

  constructor(
    store: RegionalPaywallSnapshotStore,
    validator: RegionalPaywallSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalPaywallSnapshotEngine,
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
      throw new Error(`regional paywall snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional paywall snapshot ${code} not found`);
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
      throw new Error(`regional paywall snapshot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalPaywallSnapshotDesk(store: RegionalPaywallSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalPaywallSnapshotDesk {
  return new RegionalPaywallSnapshotDesk(
    store,
    defaultRegionalPaywallSnapshotValidator(),
    clockValue,
    [],
    defaultRegionalPaywallSnapshotEngine(flagsValue),
  );
}
