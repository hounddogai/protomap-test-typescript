import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeProfileEngine, defaultChallengeProfileEngine } from "./challenge-profile-engine.js";
import { ChallengeProfileValidator, defaultChallengeProfileValidator } from "./challenge-profile-rules.js";
import { ChallengeProfileStore } from "./challenge-profile-store.js";

/** Moves challenge profiles through their life cycle and keeps a journal of what it did. */
export class ChallengeProfileWorkflow {
  store: ChallengeProfileStore;
  validator: ChallengeProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeProfileEngine;

  constructor(
    store: ChallengeProfileStore,
    validator: ChallengeProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeProfileEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge profile ${code} not found`);
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
      throw new Error(`challenge profile ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newChallengeProfileWorkflow(store: ChallengeProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeProfileWorkflow {
  return new ChallengeProfileWorkflow(
    store,
    defaultChallengeProfileValidator(),
    clockValue,
    [],
    defaultChallengeProfileEngine(flagsValue),
  );
}
