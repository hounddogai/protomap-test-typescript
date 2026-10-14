import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientChallengeScoreEngine, defaultLenientChallengeScoreEngine } from "./lenient-challenge-score-engine.js";
import {
  LenientChallengeScoreValidator,
  defaultLenientChallengeScoreValidator,
} from "./lenient-challenge-score-rules.js";
import { LenientChallengeScoreStore } from "./lenient-challenge-score-store.js";

/** Moves lenient challenge scores through their life cycle and keeps a journal of what it did. */
export class LenientChallengeScoreDesk {
  store: LenientChallengeScoreStore;
  validator: LenientChallengeScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientChallengeScoreEngine;

  constructor(
    store: LenientChallengeScoreStore,
    validator: LenientChallengeScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientChallengeScoreEngine,
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
      throw new Error(`lenient challenge score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient challenge score ${code} not found`);
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
      throw new Error(`lenient challenge score ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLenientChallengeScoreDesk(store: LenientChallengeScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientChallengeScoreDesk {
  return new LenientChallengeScoreDesk(
    store,
    defaultLenientChallengeScoreValidator(),
    clockValue,
    [],
    defaultLenientChallengeScoreEngine(flagsValue),
  );
}
