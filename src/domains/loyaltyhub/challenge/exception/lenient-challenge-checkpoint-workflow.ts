import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientChallengeCheckpointEngine,
  defaultLenientChallengeCheckpointEngine,
} from "./lenient-challenge-checkpoint-engine.js";
import {
  LenientChallengeCheckpointValidator,
  defaultLenientChallengeCheckpointValidator,
} from "./lenient-challenge-checkpoint-rules.js";
import { LenientChallengeCheckpointStore } from "./lenient-challenge-checkpoint-store.js";

/** Moves lenient challenge checkpoints through their life cycle and keeps a journal of what it did. */
export class LenientChallengeCheckpointCoordinator {
  store: LenientChallengeCheckpointStore;
  validator: LenientChallengeCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientChallengeCheckpointEngine;

  constructor(
    store: LenientChallengeCheckpointStore,
    validator: LenientChallengeCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientChallengeCheckpointEngine,
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
      throw new Error(`lenient challenge checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient challenge checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient challenge checkpoint ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLenientChallengeCheckpointCoordinator(store: LenientChallengeCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientChallengeCheckpointCoordinator {
  return new LenientChallengeCheckpointCoordinator(
    store,
    defaultLenientChallengeCheckpointValidator(),
    clockValue,
    [],
    defaultLenientChallengeCheckpointEngine(flagsValue),
  );
}
