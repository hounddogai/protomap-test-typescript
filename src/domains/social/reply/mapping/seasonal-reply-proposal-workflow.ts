import * as clock from "../../../../kit/clock.js";
import {
  SeasonalReplyProposalValidator,
  defaultSeasonalReplyProposalValidator,
} from "./seasonal-reply-proposal-rules.js";
import { SeasonalReplyProposalStore } from "./seasonal-reply-proposal-store.js";

/** Moves seasonal reply proposals through their life cycle and keeps a journal of what it did. */
export class SeasonalReplyProposalService {
  store: SeasonalReplyProposalStore;
  validator: SeasonalReplyProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalReplyProposalStore,
    validator: SeasonalReplyProposalValidator,
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
      throw new Error(`seasonal reply proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reply proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newSeasonalReplyProposalService(store: SeasonalReplyProposalStore, clockValue: clock.Clock): SeasonalReplyProposalService {
  return new SeasonalReplyProposalService(store, defaultSeasonalReplyProposalValidator(), clockValue, []);
}
