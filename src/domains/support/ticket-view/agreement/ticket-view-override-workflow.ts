import * as clock from "../../../../kit/clock.js";
import { TicketViewOverrideValidator, defaultTicketViewOverrideValidator } from "./ticket-view-override-rules.js";
import { TicketViewOverrideStore } from "./ticket-view-override-store.js";

/** Moves ticket view overrides through their life cycle and keeps a journal of what it did. */
export class TicketViewOverrideService {
  store: TicketViewOverrideStore;
  validator: TicketViewOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TicketViewOverrideStore,
    validator: TicketViewOverrideValidator,
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
      throw new Error(`ticket view override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newTicketViewOverrideService(store: TicketViewOverrideStore, clockValue: clock.Clock): TicketViewOverrideService {
  return new TicketViewOverrideService(store, defaultTicketViewOverrideValidator(), clockValue, []);
}
