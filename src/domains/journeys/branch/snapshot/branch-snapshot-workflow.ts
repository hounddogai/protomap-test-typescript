import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BranchSnapshotEngine, defaultBranchSnapshotEngine } from "./branch-snapshot-engine.js";
import { BranchSnapshotValidator, defaultBranchSnapshotValidator } from "./branch-snapshot-rules.js";
import { BranchSnapshotStore } from "./branch-snapshot-store.js";

/** Moves branch snapshots through their life cycle and keeps a journal of what it did. */
export class BranchSnapshotDesk {
  store: BranchSnapshotStore;
  validator: BranchSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchSnapshotEngine;

  constructor(
    store: BranchSnapshotStore,
    validator: BranchSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchSnapshotEngine,
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
      throw new Error(`branch snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch snapshot ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newBranchSnapshotDesk(store: BranchSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): BranchSnapshotDesk {
  return new BranchSnapshotDesk(
    store,
    defaultBranchSnapshotValidator(),
    clockValue,
    [],
    defaultBranchSnapshotEngine(flagsValue),
  );
}
