import * as clock from "../../../../kit/clock.js";
import {
  RollingChallengeCheckpointEngine,
  defaultRollingChallengeCheckpointEngine,
} from "./rolling-challenge-checkpoint-engine.js";
import {
  RollingChallengeCheckpointValidator,
  defaultRollingChallengeCheckpointValidator,
} from "./rolling-challenge-checkpoint-rules.js";
import { RollingChallengeCheckpointStore } from "./rolling-challenge-checkpoint-store.js";

/** Moves rolling challenge checkpoints through their life cycle and keeps a journal of what it did. */
export class RollingChallengeCheckpointManager {
  store: RollingChallengeCheckpointStore;
  validator: RollingChallengeCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingChallengeCheckpointEngine;

  constructor(
    store: RollingChallengeCheckpointStore,
    validator: RollingChallengeCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingChallengeCheckpointEngine,
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
      throw new Error(`rolling challenge checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling challenge checkpoint ${code} not found`);
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
      throw new Error(`rolling challenge checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newRollingChallengeCheckpointManager(store: RollingChallengeCheckpointStore, clockValue: clock.Clock): RollingChallengeCheckpointManager {
  return new RollingChallengeCheckpointManager(
    store,
    defaultRollingChallengeCheckpointValidator(),
    clockValue,
    [],
    defaultRollingChallengeCheckpointEngine(),
  );
}
