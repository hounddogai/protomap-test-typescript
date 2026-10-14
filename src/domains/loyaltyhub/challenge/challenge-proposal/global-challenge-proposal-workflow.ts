import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalChallengeProposalEngine,
  defaultGlobalChallengeProposalEngine,
} from "./global-challenge-proposal-engine.js";
import {
  GlobalChallengeProposalValidator,
  defaultGlobalChallengeProposalValidator,
} from "./global-challenge-proposal-rules.js";
import { GlobalChallengeProposalStore } from "./global-challenge-proposal-store.js";

/** Moves global challenge proposals through their life cycle and keeps a journal of what it did. */
export class GlobalChallengeProposalManager {
  store: GlobalChallengeProposalStore;
  validator: GlobalChallengeProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalChallengeProposalEngine;

  constructor(
    store: GlobalChallengeProposalStore,
    validator: GlobalChallengeProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalChallengeProposalEngine,
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
      throw new Error(`global challenge proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global challenge proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global challenge proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalChallengeProposalManager(store: GlobalChallengeProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalChallengeProposalManager {
  return new GlobalChallengeProposalManager(
    store,
    defaultGlobalChallengeProposalValidator(),
    clockValue,
    [],
    defaultGlobalChallengeProposalEngine(flagsValue),
  );
}
