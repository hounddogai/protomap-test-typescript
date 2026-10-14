import * as clock from "../../../../kit/clock.js";
import { CappedPathSnapshotEngine, defaultCappedPathSnapshotEngine } from "./capped-path-snapshot-engine.js";
import { CappedPathSnapshotValidator, defaultCappedPathSnapshotValidator } from "./capped-path-snapshot-rules.js";
import { CappedPathSnapshotStore } from "./capped-path-snapshot-store.js";

/** Moves capped path snapshots through their life cycle and keeps a journal of what it did. */
export class CappedPathSnapshotCoordinator {
  store: CappedPathSnapshotStore;
  validator: CappedPathSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedPathSnapshotEngine;

  constructor(
    store: CappedPathSnapshotStore,
    validator: CappedPathSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedPathSnapshotEngine,
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
      throw new Error(`capped path snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped path snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped path snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCappedPathSnapshotCoordinator(store: CappedPathSnapshotStore, clockValue: clock.Clock): CappedPathSnapshotCoordinator {
  return new CappedPathSnapshotCoordinator(
    store,
    defaultCappedPathSnapshotValidator(),
    clockValue,
    [],
    defaultCappedPathSnapshotEngine(),
  );
}
