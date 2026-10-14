import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeRecordEngine, defaultChallengeRecordEngine } from "./challenge-record-engine.js";
import { ChallengeRecordValidator, defaultChallengeRecordValidator } from "./challenge-record-rules.js";
import { ChallengeRecordStore } from "./challenge-record-store.js";

/** Moves challenge records through their life cycle and keeps a journal of what it did. */
export class ChallengeRecordManager {
  store: ChallengeRecordStore;
  validator: ChallengeRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeRecordEngine;

  constructor(
    store: ChallengeRecordStore,
    validator: ChallengeRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeRecordEngine,
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
      throw new Error(`challenge record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge record ${code} not found`);
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
      throw new Error(`challenge record ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newChallengeRecordManager(store: ChallengeRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeRecordManager {
  return new ChallengeRecordManager(
    store,
    defaultChallengeRecordValidator(),
    clockValue,
    [],
    defaultChallengeRecordEngine(flagsValue),
  );
}
