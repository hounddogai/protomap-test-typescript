import * as clock from "../../../../kit/clock.js";
import { LegacyChallengeRecordEngine, defaultLegacyChallengeRecordEngine } from "./legacy-challenge-record-engine.js";
import {
  LegacyChallengeRecordValidator,
  defaultLegacyChallengeRecordValidator,
} from "./legacy-challenge-record-rules.js";
import { LegacyChallengeRecordStore } from "./legacy-challenge-record-store.js";

/** Moves legacy challenge records through their life cycle and keeps a journal of what it did. */
export class LegacyChallengeRecordCoordinator {
  store: LegacyChallengeRecordStore;
  validator: LegacyChallengeRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyChallengeRecordEngine;

  constructor(
    store: LegacyChallengeRecordStore,
    validator: LegacyChallengeRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyChallengeRecordEngine,
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
      throw new Error(`legacy challenge record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy challenge record ${code} not found`);
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
      throw new Error(`legacy challenge record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newLegacyChallengeRecordCoordinator(store: LegacyChallengeRecordStore, clockValue: clock.Clock): LegacyChallengeRecordCoordinator {
  return new LegacyChallengeRecordCoordinator(
    store,
    defaultLegacyChallengeRecordValidator(),
    clockValue,
    [],
    defaultLegacyChallengeRecordEngine(),
  );
}
