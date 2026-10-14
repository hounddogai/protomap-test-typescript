import * as clock from "../../../../kit/clock.js";
import {
  LenientTicketViewReviewEngine,
  defaultLenientTicketViewReviewEngine,
} from "./lenient-ticket-view-review-engine.js";
import {
  LenientTicketViewReviewValidator,
  defaultLenientTicketViewReviewValidator,
} from "./lenient-ticket-view-review-rules.js";
import { LenientTicketViewReviewStore } from "./lenient-ticket-view-review-store.js";

/** Moves lenient ticket view reviews through their life cycle and keeps a journal of what it did. */
export class LenientTicketViewReviewWorkflow {
  store: LenientTicketViewReviewStore;
  validator: LenientTicketViewReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientTicketViewReviewEngine;

  constructor(
    store: LenientTicketViewReviewStore,
    validator: LenientTicketViewReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientTicketViewReviewEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient ticket view review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient ticket view review ${code} not found`);
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
      throw new Error(`lenient ticket view review ${code} not found`);
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

export function newLenientTicketViewReviewWorkflow(store: LenientTicketViewReviewStore, clockValue: clock.Clock): LenientTicketViewReviewWorkflow {
  return new LenientTicketViewReviewWorkflow(
    store,
    defaultLenientTicketViewReviewValidator(),
    clockValue,
    [],
    defaultLenientTicketViewReviewEngine(),
  );
}
