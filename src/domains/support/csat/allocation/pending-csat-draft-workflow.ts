import * as clock from "../../../../kit/clock.js";
import { PendingCsatDraftValidator, defaultPendingCsatDraftValidator } from "./pending-csat-draft-rules.js";
import { PendingCsatDraftStore } from "./pending-csat-draft-store.js";

/** Moves pending csat drafts through their life cycle and keeps a journal of what it did. */
export class PendingCsatDraftManager {
  store: PendingCsatDraftStore;
  validator: PendingCsatDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingCsatDraftStore,
    validator: PendingCsatDraftValidator,
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
      throw new Error(`pending csat draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending csat draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newPendingCsatDraftManager(store: PendingCsatDraftStore, clockValue: clock.Clock): PendingCsatDraftManager {
  return new PendingCsatDraftManager(store, defaultPendingCsatDraftValidator(), clockValue, []);
}
