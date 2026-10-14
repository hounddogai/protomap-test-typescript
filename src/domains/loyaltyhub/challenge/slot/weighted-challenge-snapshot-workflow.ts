import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedChallengeSnapshotEngine,
  defaultWeightedChallengeSnapshotEngine,
} from "./weighted-challenge-snapshot-engine.js";
import {
  WeightedChallengeSnapshotValidator,
  defaultWeightedChallengeSnapshotValidator,
} from "./weighted-challenge-snapshot-rules.js";
import { WeightedChallengeSnapshotStore } from "./weighted-challenge-snapshot-store.js";

/** Moves weighted challenge snapshots through their life cycle and keeps a journal of what it did. */
export class WeightedChallengeSnapshotCoordinator {
  store: WeightedChallengeSnapshotStore;
  validator: WeightedChallengeSnapshotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedChallengeSnapshotEngine;

  constructor(
    store: WeightedChallengeSnapshotStore,
    validator: WeightedChallengeSnapshotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedChallengeSnapshotEngine,
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
      throw new Error(`weighted challenge snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted challenge snapshot ${code} not found`);
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
      throw new Error(`weighted challenge snapshot ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedChallengeSnapshotCoordinator(store: WeightedChallengeSnapshotStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedChallengeSnapshotCoordinator {
  return new WeightedChallengeSnapshotCoordinator(
    store,
    defaultWeightedChallengeSnapshotValidator(),
    clockValue,
    [],
    defaultWeightedChallengeSnapshotEngine(flagsValue),
  );
}
