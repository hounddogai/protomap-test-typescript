import * as clock from "../../../../kit/clock.js";
import { TicketViewRecordEngine, defaultTicketViewRecordEngine } from "./ticket-view-record-engine.js";
import { TicketViewRecordValidator, defaultTicketViewRecordValidator } from "./ticket-view-record-rules.js";
import { TicketViewRecordStore } from "./ticket-view-record-store.js";

/** Moves ticket view records through their life cycle and keeps a journal of what it did. */
export class TicketViewRecordService {
  store: TicketViewRecordStore;
  validator: TicketViewRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewRecordEngine;

  constructor(
    store: TicketViewRecordStore,
    validator: TicketViewRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewRecordEngine,
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
      throw new Error(`ticket view record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view record ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newTicketViewRecordService(store: TicketViewRecordStore, clockValue: clock.Clock): TicketViewRecordService {
  return new TicketViewRecordService(
    store,
    defaultTicketViewRecordValidator(),
    clockValue,
    [],
    defaultTicketViewRecordEngine(),
  );
}
