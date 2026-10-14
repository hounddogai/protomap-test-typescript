import * as clock from "../../../../kit/clock.js";
import {
  TieredTicketViewReviewEngine,
  defaultTieredTicketViewReviewEngine,
} from "./tiered-ticket-view-review-engine.js";
import {
  TieredTicketViewReviewValidator,
  defaultTieredTicketViewReviewValidator,
} from "./tiered-ticket-view-review-rules.js";
import { TieredTicketViewReviewStore } from "./tiered-ticket-view-review-store.js";

/** Moves tiered ticket view reviews through their life cycle and keeps a journal of what it did. */
export class TieredTicketViewReviewDesk {
  store: TieredTicketViewReviewStore;
  validator: TieredTicketViewReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTicketViewReviewEngine;

  constructor(
    store: TieredTicketViewReviewStore,
    validator: TieredTicketViewReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTicketViewReviewEngine,
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
      throw new Error(`tiered ticket view review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered ticket view review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered ticket view review ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredTicketViewReviewDesk(store: TieredTicketViewReviewStore, clockValue: clock.Clock): TieredTicketViewReviewDesk {
  return new TieredTicketViewReviewDesk(
    store,
    defaultTieredTicketViewReviewValidator(),
    clockValue,
    [],
    defaultTieredTicketViewReviewEngine(),
  );
}
