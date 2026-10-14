import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredMacroSnapshotEngine, defaultTieredMacroSnapshotEngine } from "./tiered-macro-snapshot-engine.js";
import { TieredMacroSnapshotValidator, defaultTieredMacroSnapshotValidator } from "./tiered-macro-snapshot-rules.js";
import { TieredMacroSnapshotStore } from "./tiered-macro-snapshot-store.js";

/** Moves tiered macro snapshots through their life cycle and keeps a journal of what it did. */
export class TieredMacroSnapshotDesk {
  store: TieredMacroSnapshotStore;
  validator: TieredMacroSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredMacroSnapshotEngine;

  constructor(
    store: TieredMacroSnapshotStore,
    validator: TieredMacroSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredMacroSnapshotEngine,
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
      throw new Error(`tiered macro snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered macro snapshot ${code} not found`);
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
      throw new Error(`tiered macro snapshot ${code} not found`);
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

export function newTieredMacroSnapshotDesk(store: TieredMacroSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredMacroSnapshotDesk {
  return new TieredMacroSnapshotDesk(
    store,
    defaultTieredMacroSnapshotValidator(),
    clockValue,
    [],
    defaultTieredMacroSnapshotEngine(flagsValue),
  );
}
