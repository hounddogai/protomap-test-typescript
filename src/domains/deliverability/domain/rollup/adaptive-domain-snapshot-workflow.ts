import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveDomainSnapshotEngine,
  defaultAdaptiveDomainSnapshotEngine,
} from "./adaptive-domain-snapshot-engine.js";
import {
  AdaptiveDomainSnapshotValidator,
  defaultAdaptiveDomainSnapshotValidator,
} from "./adaptive-domain-snapshot-rules.js";
import { AdaptiveDomainSnapshotStore } from "./adaptive-domain-snapshot-store.js";

/** Moves adaptive domain snapshots through their life cycle and keeps a journal of what it did. */
export class AdaptiveDomainSnapshotService {
  store: AdaptiveDomainSnapshotStore;
  validator: AdaptiveDomainSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDomainSnapshotEngine;

  constructor(
    store: AdaptiveDomainSnapshotStore,
    validator: AdaptiveDomainSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDomainSnapshotEngine,
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
      throw new Error(`adaptive domain snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain snapshot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newAdaptiveDomainSnapshotService(store: AdaptiveDomainSnapshotStore, clockValue: clock.Clock): AdaptiveDomainSnapshotService {
  return new AdaptiveDomainSnapshotService(
    store,
    defaultAdaptiveDomainSnapshotValidator(),
    clockValue,
    [],
    defaultAdaptiveDomainSnapshotEngine(),
  );
}
