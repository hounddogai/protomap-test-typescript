import * as clock from "../../../../kit/clock.js";
import { PendingInviteProposalEngine, defaultPendingInviteProposalEngine } from "./pending-invite-proposal-engine.js";
import {
  PendingInviteProposalValidator,
  defaultPendingInviteProposalValidator,
} from "./pending-invite-proposal-rules.js";
import { PendingInviteProposalStore } from "./pending-invite-proposal-store.js";

/** Moves pending invite proposals through their life cycle and keeps a journal of what it did. */
export class PendingInviteProposalManager {
  store: PendingInviteProposalStore;
  validator: PendingInviteProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingInviteProposalEngine;

  constructor(
    store: PendingInviteProposalStore,
    validator: PendingInviteProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingInviteProposalEngine,
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
      throw new Error(`pending invite proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPendingInviteProposalManager(store: PendingInviteProposalStore, clockValue: clock.Clock): PendingInviteProposalManager {
  return new PendingInviteProposalManager(
    store,
    defaultPendingInviteProposalValidator(),
    clockValue,
    [],
    defaultPendingInviteProposalEngine(),
  );
}
