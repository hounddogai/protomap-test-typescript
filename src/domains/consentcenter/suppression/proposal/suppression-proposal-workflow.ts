import * as clock from "../../../../kit/clock.js";
import { SuppressionProposalValidator, defaultSuppressionProposalValidator } from "./suppression-proposal-rules.js";
import { SuppressionProposalStore } from "./suppression-proposal-store.js";

/** Moves suppression proposals through their life cycle and keeps a journal of what it did. */
export class SuppressionProposalManager {
  store: SuppressionProposalStore;
  validator: SuppressionProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SuppressionProposalStore,
    validator: SuppressionProposalValidator,
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
      throw new Error(`suppression proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newSuppressionProposalManager(store: SuppressionProposalStore, clockValue: clock.Clock): SuppressionProposalManager {
  return new SuppressionProposalManager(store, defaultSuppressionProposalValidator(), clockValue, []);
}
