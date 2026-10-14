import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveBounceProposalValidator,
  defaultAdaptiveBounceProposalValidator,
} from "./adaptive-bounce-proposal-rules.js";
import { AdaptiveBounceProposalStore } from "./adaptive-bounce-proposal-store.js";

/** Moves adaptive bounce proposals through their life cycle and keeps a journal of what it did. */
export class AdaptiveBounceProposalManager {
  store: AdaptiveBounceProposalStore;
  validator: AdaptiveBounceProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveBounceProposalStore,
    validator: AdaptiveBounceProposalValidator,
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
      throw new Error(`adaptive bounce proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive bounce proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newAdaptiveBounceProposalManager(store: AdaptiveBounceProposalStore, clockValue: clock.Clock): AdaptiveBounceProposalManager {
  return new AdaptiveBounceProposalManager(store, defaultAdaptiveBounceProposalValidator(), clockValue, []);
}
