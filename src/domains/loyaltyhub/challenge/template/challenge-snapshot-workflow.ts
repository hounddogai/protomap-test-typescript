import * as clock from "../../../../kit/clock.js";
import { ChallengeSnapshotEngine, defaultChallengeSnapshotEngine } from "./challenge-snapshot-engine.js";
import { ChallengeSnapshotValidator, defaultChallengeSnapshotValidator } from "./challenge-snapshot-rules.js";
import { ChallengeSnapshotStore } from "./challenge-snapshot-store.js";

/** Moves challenge snapshots through their life cycle and keeps a journal of what it did. */
export class ChallengeSnapshotWorkflow {
  store: ChallengeSnapshotStore;
  validator: ChallengeSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeSnapshotEngine;

  constructor(
    store: ChallengeSnapshotStore,
    validator: ChallengeSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeSnapshotEngine,
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
      throw new Error(`challenge snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge snapshot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newChallengeSnapshotWorkflow(store: ChallengeSnapshotStore, clockValue: clock.Clock): ChallengeSnapshotWorkflow {
  return new ChallengeSnapshotWorkflow(
    store,
    defaultChallengeSnapshotValidator(),
    clockValue,
    [],
    defaultChallengeSnapshotEngine(),
  );
}
