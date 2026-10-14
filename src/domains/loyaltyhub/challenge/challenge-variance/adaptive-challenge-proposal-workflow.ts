import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveChallengeProposalEngine,
  defaultAdaptiveChallengeProposalEngine,
} from "./adaptive-challenge-proposal-engine.js";
import {
  AdaptiveChallengeProposalValidator,
  defaultAdaptiveChallengeProposalValidator,
} from "./adaptive-challenge-proposal-rules.js";
import { AdaptiveChallengeProposalStore } from "./adaptive-challenge-proposal-store.js";

/** Moves adaptive challenge proposals through their life cycle and keeps a journal of what it did. */
export class AdaptiveChallengeProposalDesk {
  store: AdaptiveChallengeProposalStore;
  validator: AdaptiveChallengeProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveChallengeProposalEngine;

  constructor(
    store: AdaptiveChallengeProposalStore,
    validator: AdaptiveChallengeProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveChallengeProposalEngine,
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
      throw new Error(`adaptive challenge proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive challenge proposal ${code} not found`);
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
      throw new Error(`adaptive challenge proposal ${code} not found`);
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

export function newAdaptiveChallengeProposalDesk(store: AdaptiveChallengeProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveChallengeProposalDesk {
  return new AdaptiveChallengeProposalDesk(
    store,
    defaultAdaptiveChallengeProposalValidator(),
    clockValue,
    [],
    defaultAdaptiveChallengeProposalEngine(flagsValue),
  );
}
