import * as clock from "../../../../kit/clock.js";
import { TicketViewScoreValidator, defaultTicketViewScoreValidator } from "./ticket-view-score-rules.js";
import { TicketViewScoreStore } from "./ticket-view-score-store.js";

/** Moves ticket view scores through their life cycle and keeps a journal of what it did. */
export class TicketViewScoreWorkflow {
  store: TicketViewScoreStore;
  validator: TicketViewScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TicketViewScoreStore,
    validator: TicketViewScoreValidator,
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
      throw new Error(`ticket view score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newTicketViewScoreWorkflow(store: TicketViewScoreStore, clockValue: clock.Clock): TicketViewScoreWorkflow {
  return new TicketViewScoreWorkflow(store, defaultTicketViewScoreValidator(), clockValue, []);
}
