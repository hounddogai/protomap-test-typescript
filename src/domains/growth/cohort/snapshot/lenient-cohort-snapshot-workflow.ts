import * as clock from "../../../../kit/clock.js";
import { LenientCohortSnapshotEngine, defaultLenientCohortSnapshotEngine } from "./lenient-cohort-snapshot-engine.js";
import {
  LenientCohortSnapshotValidator,
  defaultLenientCohortSnapshotValidator,
} from "./lenient-cohort-snapshot-rules.js";
import { LenientCohortSnapshotStore } from "./lenient-cohort-snapshot-store.js";

/** Moves lenient cohort snapshots through their life cycle and keeps a journal of what it did. */
export class LenientCohortSnapshotService {
  store: LenientCohortSnapshotStore;
  validator: LenientCohortSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientCohortSnapshotEngine;

  constructor(
    store: LenientCohortSnapshotStore,
    validator: LenientCohortSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientCohortSnapshotEngine,
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
      throw new Error(`lenient cohort snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient cohort snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient cohort snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newLenientCohortSnapshotService(store: LenientCohortSnapshotStore, clockValue: clock.Clock): LenientCohortSnapshotService {
  return new LenientCohortSnapshotService(
    store,
    defaultLenientCohortSnapshotValidator(),
    clockValue,
    [],
    defaultLenientCohortSnapshotEngine(),
  );
}
