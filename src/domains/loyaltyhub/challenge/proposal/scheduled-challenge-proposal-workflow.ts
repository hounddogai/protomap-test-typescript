import * as clock from "../../../../kit/clock.js";
import {
  ScheduledChallengeProposalValidator,
  defaultScheduledChallengeProposalValidator,
} from "./scheduled-challenge-proposal-rules.js";
import { ScheduledChallengeProposalStore } from "./scheduled-challenge-proposal-store.js";

/** Moves scheduled challenge proposals through their life cycle and keeps a journal of what it did. */
export class ScheduledChallengeProposalService {
  store: ScheduledChallengeProposalStore;
  validator: ScheduledChallengeProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledChallengeProposalStore,
    validator: ScheduledChallengeProposalValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled challenge proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled challenge proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newScheduledChallengeProposalService(store: ScheduledChallengeProposalStore, clockValue: clock.Clock): ScheduledChallengeProposalService {
  return new ScheduledChallengeProposalService(store, defaultScheduledChallengeProposalValidator(), clockValue, []);
}
