import * as clock from "../../../../kit/clock.js";
import { ReputationSnapshotEngine, defaultReputationSnapshotEngine } from "./reputation-snapshot-engine.js";
import { ReputationSnapshotValidator, defaultReputationSnapshotValidator } from "./reputation-snapshot-rules.js";
import { ReputationSnapshotStore } from "./reputation-snapshot-store.js";

/** Moves reputation snapshots through their life cycle and keeps a journal of what it did. */
export class ReputationSnapshotService {
  store: ReputationSnapshotStore;
  validator: ReputationSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationSnapshotEngine;

  constructor(
    store: ReputationSnapshotStore,
    validator: ReputationSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationSnapshotEngine,
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
      throw new Error(`reputation snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation snapshot ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newReputationSnapshotService(store: ReputationSnapshotStore, clockValue: clock.Clock): ReputationSnapshotService {
  return new ReputationSnapshotService(
    store,
    defaultReputationSnapshotValidator(),
    clockValue,
    [],
    defaultReputationSnapshotEngine(),
  );
}
