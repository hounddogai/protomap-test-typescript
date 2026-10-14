import * as clock from "../../../../kit/clock.js";
import { TicketViewExceptionEngine, defaultTicketViewExceptionEngine } from "./ticket-view-exception-engine.js";
import { TicketViewExceptionValidator, defaultTicketViewExceptionValidator } from "./ticket-view-exception-rules.js";
import { TicketViewExceptionStore } from "./ticket-view-exception-store.js";

/** Moves ticket view exceptions through their life cycle and keeps a journal of what it did. */
export class TicketViewExceptionDesk {
  store: TicketViewExceptionStore;
  validator: TicketViewExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewExceptionEngine;

  constructor(
    store: TicketViewExceptionStore,
    validator: TicketViewExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewExceptionEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view exception ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newTicketViewExceptionDesk(store: TicketViewExceptionStore, clockValue: clock.Clock): TicketViewExceptionDesk {
  return new TicketViewExceptionDesk(
    store,
    defaultTicketViewExceptionValidator(),
    clockValue,
    [],
    defaultTicketViewExceptionEngine(),
  );
}
