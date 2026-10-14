import * as clock from "../../../../kit/clock.js";
import {
  PendingReputationProfileValidator,
  defaultPendingReputationProfileValidator,
} from "./pending-reputation-profile-rules.js";
import { PendingReputationProfileStore } from "./pending-reputation-profile-store.js";

/** Moves pending reputation profiles through their life cycle and keeps a journal of what it did. */
export class PendingReputationProfileService {
  store: PendingReputationProfileStore;
  validator: PendingReputationProfileValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingReputationProfileStore,
    validator: PendingReputationProfileValidator,
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
      throw new Error(`pending reputation profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending reputation profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingReputationProfileService(store: PendingReputationProfileStore, clockValue: clock.Clock): PendingReputationProfileService {
  return new PendingReputationProfileService(store, defaultPendingReputationProfileValidator(), clockValue, []);
}
