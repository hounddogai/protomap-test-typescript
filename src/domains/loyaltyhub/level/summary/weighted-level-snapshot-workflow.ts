import * as clock from "../../../../kit/clock.js";
import { WeightedLevelSnapshotEngine, defaultWeightedLevelSnapshotEngine } from "./weighted-level-snapshot-engine.js";
import {
  WeightedLevelSnapshotValidator,
  defaultWeightedLevelSnapshotValidator,
} from "./weighted-level-snapshot-rules.js";
import { WeightedLevelSnapshotStore } from "./weighted-level-snapshot-store.js";

/** Moves weighted level snapshots through their life cycle and keeps a journal of what it did. */
export class WeightedLevelSnapshotCoordinator {
  store: WeightedLevelSnapshotStore;
  validator: WeightedLevelSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedLevelSnapshotEngine;

  constructor(
    store: WeightedLevelSnapshotStore,
    validator: WeightedLevelSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedLevelSnapshotEngine,
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
      throw new Error(`weighted level snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted level snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted level snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newWeightedLevelSnapshotCoordinator(store: WeightedLevelSnapshotStore, clockValue: clock.Clock): WeightedLevelSnapshotCoordinator {
  return new WeightedLevelSnapshotCoordinator(
    store,
    defaultWeightedLevelSnapshotValidator(),
    clockValue,
    [],
    defaultWeightedLevelSnapshotEngine(),
  );
}
