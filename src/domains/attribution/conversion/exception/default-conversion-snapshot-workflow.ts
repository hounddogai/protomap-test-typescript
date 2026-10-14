import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultConversionSnapshotEngine,
  defaultDefaultConversionSnapshotEngine,
} from "./default-conversion-snapshot-engine.js";
import {
  DefaultConversionSnapshotValidator,
  defaultDefaultConversionSnapshotValidator,
} from "./default-conversion-snapshot-rules.js";
import { DefaultConversionSnapshotStore } from "./default-conversion-snapshot-store.js";

/** Moves default conversion snapshots through their life cycle and keeps a journal of what it did. */
export class DefaultConversionSnapshotManager {
  store: DefaultConversionSnapshotStore;
  validator: DefaultConversionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultConversionSnapshotEngine;

  constructor(
    store: DefaultConversionSnapshotStore,
    validator: DefaultConversionSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultConversionSnapshotEngine,
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
      throw new Error(`default conversion snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default conversion snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default conversion snapshot ${code} not found`);
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

export function newDefaultConversionSnapshotManager(store: DefaultConversionSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultConversionSnapshotManager {
  return new DefaultConversionSnapshotManager(
    store,
    defaultDefaultConversionSnapshotValidator(),
    clockValue,
    [],
    defaultDefaultConversionSnapshotEngine(flagsValue),
  );
}
