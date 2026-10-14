import * as clock from "../../../../kit/clock.js";
import {
  TieredChallengeAuditValidator,
  defaultTieredChallengeAuditValidator,
} from "./tiered-challenge-audit-rules.js";
import { TieredChallengeAuditStore } from "./tiered-challenge-audit-store.js";

/** Moves tiered challenge audits through their life cycle and keeps a journal of what it did. */
export class TieredChallengeAuditDesk {
  store: TieredChallengeAuditStore;
  validator: TieredChallengeAuditValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredChallengeAuditStore,
    validator: TieredChallengeAuditValidator,
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
      throw new Error(`tiered challenge audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered challenge audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredChallengeAuditDesk(store: TieredChallengeAuditStore, clockValue: clock.Clock): TieredChallengeAuditDesk {
  return new TieredChallengeAuditDesk(store, defaultTieredChallengeAuditValidator(), clockValue, []);
}
