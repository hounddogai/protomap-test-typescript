import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedTouchpointSnapshotEngine,
  defaultCappedTouchpointSnapshotEngine,
} from "./capped-touchpoint-snapshot-engine.js";
import {
  CappedTouchpointSnapshotValidator,
  defaultCappedTouchpointSnapshotValidator,
} from "./capped-touchpoint-snapshot-rules.js";
import { CappedTouchpointSnapshotStore } from "./capped-touchpoint-snapshot-store.js";

/** Moves capped touchpoint snapshots through their life cycle and keeps a journal of what it did. */
export class CappedTouchpointSnapshotCoordinator {
  store: CappedTouchpointSnapshotStore;
  validator: CappedTouchpointSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedTouchpointSnapshotEngine;

  constructor(
    store: CappedTouchpointSnapshotStore,
    validator: CappedTouchpointSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedTouchpointSnapshotEngine,
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
      throw new Error(`capped touchpoint snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped touchpoint snapshot ${code} not found`);
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
      throw new Error(`capped touchpoint snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCappedTouchpointSnapshotCoordinator(store: CappedTouchpointSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedTouchpointSnapshotCoordinator {
  return new CappedTouchpointSnapshotCoordinator(
    store,
    defaultCappedTouchpointSnapshotValidator(),
    clockValue,
    [],
    defaultCappedTouchpointSnapshotEngine(flagsValue),
  );
}
