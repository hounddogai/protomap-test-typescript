import * as clock from "../../../../kit/clock.js";
import { TouchpointSnapshotEngine, defaultTouchpointSnapshotEngine } from "./touchpoint-snapshot-engine.js";
import { TouchpointSnapshotValidator, defaultTouchpointSnapshotValidator } from "./touchpoint-snapshot-rules.js";
import { TouchpointSnapshotStore } from "./touchpoint-snapshot-store.js";

/** Moves touchpoint snapshots through their life cycle and keeps a journal of what it did. */
export class TouchpointSnapshotService {
  store: TouchpointSnapshotStore;
  validator: TouchpointSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointSnapshotEngine;

  constructor(
    store: TouchpointSnapshotStore,
    validator: TouchpointSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointSnapshotEngine,
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
      throw new Error(`touchpoint snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newTouchpointSnapshotService(store: TouchpointSnapshotStore, clockValue: clock.Clock): TouchpointSnapshotService {
  return new TouchpointSnapshotService(
    store,
    defaultTouchpointSnapshotValidator(),
    clockValue,
    [],
    defaultTouchpointSnapshotEngine(),
  );
}
