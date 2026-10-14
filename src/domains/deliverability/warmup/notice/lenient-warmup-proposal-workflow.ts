import * as clock from "../../../../kit/clock.js";
import {
  LenientWarmupProposalValidator,
  defaultLenientWarmupProposalValidator,
} from "./lenient-warmup-proposal-rules.js";
import { LenientWarmupProposalStore } from "./lenient-warmup-proposal-store.js";

/** Moves lenient warmup proposals through their life cycle and keeps a journal of what it did. */
export class LenientWarmupProposalService {
  store: LenientWarmupProposalStore;
  validator: LenientWarmupProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientWarmupProposalStore,
    validator: LenientWarmupProposalValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newLenientWarmupProposalService(store: LenientWarmupProposalStore, clockValue: clock.Clock): LenientWarmupProposalService {
  return new LenientWarmupProposalService(store, defaultLenientWarmupProposalValidator(), clockValue, []);
}
