import * as clock from "../../../../kit/clock.js";
import {
  ManualRetentionProposalEngine,
  defaultManualRetentionProposalEngine,
} from "./manual-retention-proposal-engine.js";
import {
  ManualRetentionProposalValidator,
  defaultManualRetentionProposalValidator,
} from "./manual-retention-proposal-rules.js";
import { ManualRetentionProposalStore } from "./manual-retention-proposal-store.js";

/** Moves manual retention proposals through their life cycle and keeps a journal of what it did. */
export class ManualRetentionProposalService {
  store: ManualRetentionProposalStore;
  validator: ManualRetentionProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualRetentionProposalEngine;

  constructor(
    store: ManualRetentionProposalStore,
    validator: ManualRetentionProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualRetentionProposalEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualRetentionProposalService(store: ManualRetentionProposalStore, clockValue: clock.Clock): ManualRetentionProposalService {
  return new ManualRetentionProposalService(
    store,
    defaultManualRetentionProposalValidator(),
    clockValue,
    [],
    defaultManualRetentionProposalEngine(),
  );
}
