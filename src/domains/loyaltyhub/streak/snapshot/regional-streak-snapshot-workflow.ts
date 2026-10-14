import * as clock from "../../../../kit/clock.js";
import {
  RegionalStreakSnapshotEngine,
  defaultRegionalStreakSnapshotEngine,
} from "./regional-streak-snapshot-engine.js";
import {
  RegionalStreakSnapshotValidator,
  defaultRegionalStreakSnapshotValidator,
} from "./regional-streak-snapshot-rules.js";
import { RegionalStreakSnapshotStore } from "./regional-streak-snapshot-store.js";

/** Moves regional streak snapshots through their life cycle and keeps a journal of what it did. */
export class RegionalStreakSnapshotManager {
  store: RegionalStreakSnapshotStore;
  validator: RegionalStreakSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalStreakSnapshotEngine;

  constructor(
    store: RegionalStreakSnapshotStore,
    validator: RegionalStreakSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalStreakSnapshotEngine,
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
      throw new Error(`regional streak snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional streak snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional streak snapshot ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRegionalStreakSnapshotManager(store: RegionalStreakSnapshotStore, clockValue: clock.Clock): RegionalStreakSnapshotManager {
  return new RegionalStreakSnapshotManager(
    store,
    defaultRegionalStreakSnapshotValidator(),
    clockValue,
    [],
    defaultRegionalStreakSnapshotEngine(),
  );
}
