import * as clock from "../../../../kit/clock.js";
import {
  FallbackConversionSnapshotEngine,
  defaultFallbackConversionSnapshotEngine,
} from "./fallback-conversion-snapshot-engine.js";
import {
  FallbackConversionSnapshotValidator,
  defaultFallbackConversionSnapshotValidator,
} from "./fallback-conversion-snapshot-rules.js";
import { FallbackConversionSnapshotStore } from "./fallback-conversion-snapshot-store.js";

/** Moves fallback conversion snapshots through their life cycle and keeps a journal of what it did. */
export class FallbackConversionSnapshotDesk {
  store: FallbackConversionSnapshotStore;
  validator: FallbackConversionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackConversionSnapshotEngine;

  constructor(
    store: FallbackConversionSnapshotStore,
    validator: FallbackConversionSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackConversionSnapshotEngine,
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
      throw new Error(`fallback conversion snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback conversion snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback conversion snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFallbackConversionSnapshotDesk(store: FallbackConversionSnapshotStore, clockValue: clock.Clock): FallbackConversionSnapshotDesk {
  return new FallbackConversionSnapshotDesk(
    store,
    defaultFallbackConversionSnapshotValidator(),
    clockValue,
    [],
    defaultFallbackConversionSnapshotEngine(),
  );
}
