import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedModelSnapshotEngine, defaultCappedModelSnapshotEngine } from "./capped-model-snapshot-engine.js";
import { CappedModelSnapshotValidator, defaultCappedModelSnapshotValidator } from "./capped-model-snapshot-rules.js";
import { CappedModelSnapshotStore } from "./capped-model-snapshot-store.js";

/** Moves capped model snapshots through their life cycle and keeps a journal of what it did. */
export class CappedModelSnapshotManager {
  store: CappedModelSnapshotStore;
  validator: CappedModelSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedModelSnapshotEngine;

  constructor(
    store: CappedModelSnapshotStore,
    validator: CappedModelSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedModelSnapshotEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped model snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped model snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped model snapshot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedModelSnapshotManager(store: CappedModelSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedModelSnapshotManager {
  return new CappedModelSnapshotManager(
    store,
    defaultCappedModelSnapshotValidator(),
    clockValue,
    [],
    defaultCappedModelSnapshotEngine(flagsValue),
  );
}
