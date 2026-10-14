import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeAssignmentEngine, defaultChallengeAssignmentEngine } from "./challenge-assignment-engine.js";
import { ChallengeAssignmentValidator, defaultChallengeAssignmentValidator } from "./challenge-assignment-rules.js";
import { ChallengeAssignmentStore } from "./challenge-assignment-store.js";

/** Moves challenge assignments through their life cycle and keeps a journal of what it did. */
export class ChallengeAssignmentManager {
  store: ChallengeAssignmentStore;
  validator: ChallengeAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeAssignmentEngine;

  constructor(
    store: ChallengeAssignmentStore,
    validator: ChallengeAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeAssignmentEngine,
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
      throw new Error(`challenge assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge assignment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newChallengeAssignmentManager(store: ChallengeAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeAssignmentManager {
  return new ChallengeAssignmentManager(
    store,
    defaultChallengeAssignmentValidator(),
    clockValue,
    [],
    defaultChallengeAssignmentEngine(flagsValue),
  );
}
