import * as clock from "../../../../kit/clock.js";
import {
  TieredReputationProposalValidator,
  defaultTieredReputationProposalValidator,
} from "./tiered-reputation-proposal-rules.js";
import { TieredReputationProposalStore } from "./tiered-reputation-proposal-store.js";

/** Moves tiered reputation proposals through their life cycle and keeps a journal of what it did. */
export class TieredReputationProposalCoordinator {
  store: TieredReputationProposalStore;
  validator: TieredReputationProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredReputationProposalStore,
    validator: TieredReputationProposalValidator,
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
      throw new Error(`tiered reputation proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reputation proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newTieredReputationProposalCoordinator(store: TieredReputationProposalStore, clockValue: clock.Clock): TieredReputationProposalCoordinator {
  return new TieredReputationProposalCoordinator(store, defaultTieredReputationProposalValidator(), clockValue, []);
}
