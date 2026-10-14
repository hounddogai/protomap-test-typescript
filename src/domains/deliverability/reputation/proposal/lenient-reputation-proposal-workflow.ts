import * as clock from "../../../../kit/clock.js";
import {
  LenientReputationProposalValidator,
  defaultLenientReputationProposalValidator,
} from "./lenient-reputation-proposal-rules.js";
import { LenientReputationProposalStore } from "./lenient-reputation-proposal-store.js";

/** Moves lenient reputation proposals through their life cycle and keeps a journal of what it did. */
export class LenientReputationProposalService {
  store: LenientReputationProposalStore;
  validator: LenientReputationProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientReputationProposalStore,
    validator: LenientReputationProposalValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reputation proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reputation proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newLenientReputationProposalService(store: LenientReputationProposalStore, clockValue: clock.Clock): LenientReputationProposalService {
  return new LenientReputationProposalService(store, defaultLenientReputationProposalValidator(), clockValue, []);
}
