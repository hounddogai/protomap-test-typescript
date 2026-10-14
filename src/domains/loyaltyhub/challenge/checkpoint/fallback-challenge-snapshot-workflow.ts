import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackChallengeSnapshotEngine,
  defaultFallbackChallengeSnapshotEngine,
} from "./fallback-challenge-snapshot-engine.js";
import {
  FallbackChallengeSnapshotValidator,
  defaultFallbackChallengeSnapshotValidator,
} from "./fallback-challenge-snapshot-rules.js";
import { FallbackChallengeSnapshotStore } from "./fallback-challenge-snapshot-store.js";

/** Moves fallback challenge snapshots through their life cycle and keeps a journal of what it did. */
export class FallbackChallengeSnapshotWorkflow {
  store: FallbackChallengeSnapshotStore;
  validator: FallbackChallengeSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackChallengeSnapshotEngine;

  constructor(
    store: FallbackChallengeSnapshotStore,
    validator: FallbackChallengeSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackChallengeSnapshotEngine,
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
      throw new Error(`fallback challenge snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback challenge snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback challenge snapshot ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackChallengeSnapshotWorkflow(store: FallbackChallengeSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackChallengeSnapshotWorkflow {
  return new FallbackChallengeSnapshotWorkflow(
    store,
    defaultFallbackChallengeSnapshotValidator(),
    clockValue,
    [],
    defaultFallbackChallengeSnapshotEngine(flagsValue),
  );
}
