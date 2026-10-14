import * as clock from "../../../../kit/clock.js";
import {
  RegionalSenderSnapshotEngine,
  defaultRegionalSenderSnapshotEngine,
} from "./regional-sender-snapshot-engine.js";
import {
  RegionalSenderSnapshotValidator,
  defaultRegionalSenderSnapshotValidator,
} from "./regional-sender-snapshot-rules.js";
import { RegionalSenderSnapshotStore } from "./regional-sender-snapshot-store.js";

/** Moves regional sender snapshots through their life cycle and keeps a journal of what it did. */
export class RegionalSenderSnapshotDesk {
  store: RegionalSenderSnapshotStore;
  validator: RegionalSenderSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalSenderSnapshotEngine;

  constructor(
    store: RegionalSenderSnapshotStore,
    validator: RegionalSenderSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalSenderSnapshotEngine,
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
      throw new Error(`regional sender snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sender snapshot ${code} not found`);
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
      throw new Error(`regional sender snapshot ${code} not found`);
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

export function newRegionalSenderSnapshotDesk(store: RegionalSenderSnapshotStore, clockValue: clock.Clock): RegionalSenderSnapshotDesk {
  return new RegionalSenderSnapshotDesk(
    store,
    defaultRegionalSenderSnapshotValidator(),
    clockValue,
    [],
    defaultRegionalSenderSnapshotEngine(),
  );
}
