import * as clock from "../../../../kit/clock.js";
import {
  PrimaryTicketViewReviewValidator,
  defaultPrimaryTicketViewReviewValidator,
} from "./primary-ticket-view-review-rules.js";
import { PrimaryTicketViewReviewStore } from "./primary-ticket-view-review-store.js";

/** Moves primary ticket view reviews through their life cycle and keeps a journal of what it did. */
export class PrimaryTicketViewReviewWorkflow {
  store: PrimaryTicketViewReviewStore;
  validator: PrimaryTicketViewReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryTicketViewReviewStore,
    validator: PrimaryTicketViewReviewValidator,
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
      throw new Error(`primary ticket view review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary ticket view review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newPrimaryTicketViewReviewWorkflow(store: PrimaryTicketViewReviewStore, clockValue: clock.Clock): PrimaryTicketViewReviewWorkflow {
  return new PrimaryTicketViewReviewWorkflow(store, defaultPrimaryTicketViewReviewValidator(), clockValue, []);
}
