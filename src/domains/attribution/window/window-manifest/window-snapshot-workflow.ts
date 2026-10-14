import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WindowSnapshotEngine, defaultWindowSnapshotEngine } from "./window-snapshot-engine.js";
import { WindowSnapshotValidator, defaultWindowSnapshotValidator } from "./window-snapshot-rules.js";
import { WindowSnapshotStore } from "./window-snapshot-store.js";

/** Moves window snapshots through their life cycle and keeps a journal of what it did. */
export class WindowSnapshotCoordinator {
  store: WindowSnapshotStore;
  validator: WindowSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowSnapshotEngine;

  constructor(
    store: WindowSnapshotStore,
    validator: WindowSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowSnapshotEngine,
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
      throw new Error(`window snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window snapshot ${code} not found`);
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
      throw new Error(`window snapshot ${code} not found`);
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

export function newWindowSnapshotCoordinator(store: WindowSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): WindowSnapshotCoordinator {
  return new WindowSnapshotCoordinator(
    store,
    defaultWindowSnapshotValidator(),
    clockValue,
    [],
    defaultWindowSnapshotEngine(flagsValue),
  );
}
