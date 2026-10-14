import * as clock from "../../../../kit/clock.js";
import {
  LegacyEscalationNoticeValidator,
  defaultLegacyEscalationNoticeValidator,
} from "./legacy-escalation-notice-rules.js";
import { LegacyEscalationNoticeStore } from "./legacy-escalation-notice-store.js";

/** Moves legacy escalation notices through their life cycle and keeps a journal of what it did. */
export class LegacyEscalationNoticeDesk {
  store: LegacyEscalationNoticeStore;
  validator: LegacyEscalationNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyEscalationNoticeStore,
    validator: LegacyEscalationNoticeValidator,
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
      throw new Error(`legacy escalation notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy escalation notice ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyEscalationNoticeDesk(store: LegacyEscalationNoticeStore, clockValue: clock.Clock): LegacyEscalationNoticeDesk {
  return new LegacyEscalationNoticeDesk(store, defaultLegacyEscalationNoticeValidator(), clockValue, []);
}
