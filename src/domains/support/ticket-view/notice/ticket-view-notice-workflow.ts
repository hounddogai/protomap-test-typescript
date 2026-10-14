import * as clock from "../../../../kit/clock.js";
import { TicketViewNoticeValidator, defaultTicketViewNoticeValidator } from "./ticket-view-notice-rules.js";
import { TicketViewNoticeStore } from "./ticket-view-notice-store.js";

/** Moves ticket view notices through their life cycle and keeps a journal of what it did. */
export class TicketViewNoticeWorkflow {
  store: TicketViewNoticeStore;
  validator: TicketViewNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TicketViewNoticeStore,
    validator: TicketViewNoticeValidator,
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
      throw new Error(`ticket view notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newTicketViewNoticeWorkflow(store: TicketViewNoticeStore, clockValue: clock.Clock): TicketViewNoticeWorkflow {
  return new TicketViewNoticeWorkflow(store, defaultTicketViewNoticeValidator(), clockValue, []);
}
