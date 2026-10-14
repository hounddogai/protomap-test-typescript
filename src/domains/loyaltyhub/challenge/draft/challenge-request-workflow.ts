import * as clock from "../../../../kit/clock.js";
import { ChallengeRequestValidator, defaultChallengeRequestValidator } from "./challenge-request-rules.js";
import { ChallengeRequestStore } from "./challenge-request-store.js";

/** Moves challenge requests through their life cycle and keeps a journal of what it did. */
export class ChallengeRequestCoordinator {
  store: ChallengeRequestStore;
  validator: ChallengeRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ChallengeRequestStore,
    validator: ChallengeRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newChallengeRequestCoordinator(store: ChallengeRequestStore, clockValue: clock.Clock): ChallengeRequestCoordinator {
  return new ChallengeRequestCoordinator(store, defaultChallengeRequestValidator(), clockValue, []);
}
