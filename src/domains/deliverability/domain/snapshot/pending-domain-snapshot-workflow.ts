import * as clock from "../../../../kit/clock.js";
import { PendingDomainSnapshotEngine, defaultPendingDomainSnapshotEngine } from "./pending-domain-snapshot-engine.js";
import {
  PendingDomainSnapshotValidator,
  defaultPendingDomainSnapshotValidator,
} from "./pending-domain-snapshot-rules.js";
import { PendingDomainSnapshotStore } from "./pending-domain-snapshot-store.js";

/** Moves pending domain snapshots through their life cycle and keeps a journal of what it did. */
export class PendingDomainSnapshotService {
  store: PendingDomainSnapshotStore;
  validator: PendingDomainSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingDomainSnapshotEngine;

  constructor(
    store: PendingDomainSnapshotStore,
    validator: PendingDomainSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingDomainSnapshotEngine,
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
      throw new Error(`pending domain snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending domain snapshot ${code} not found`);
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
      throw new Error(`pending domain snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPendingDomainSnapshotService(store: PendingDomainSnapshotStore, clockValue: clock.Clock): PendingDomainSnapshotService {
  return new PendingDomainSnapshotService(
    store,
    defaultPendingDomainSnapshotValidator(),
    clockValue,
    [],
    defaultPendingDomainSnapshotEngine(),
  );
}
