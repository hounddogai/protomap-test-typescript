import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TicketViewWindowEngine, defaultTicketViewWindowEngine } from "./ticket-view-window-engine.js";
import { TicketViewWindowValidator, defaultTicketViewWindowValidator } from "./ticket-view-window-rules.js";
import { TicketViewWindowStore } from "./ticket-view-window-store.js";

/** Moves ticket view windows through their life cycle and keeps a journal of what it did. */
export class TicketViewWindowWorkflow {
  store: TicketViewWindowStore;
  validator: TicketViewWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewWindowEngine;

  constructor(
    store: TicketViewWindowStore,
    validator: TicketViewWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewWindowEngine,
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
      throw new Error(`ticket view window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view window ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTicketViewWindowWorkflow(store: TicketViewWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): TicketViewWindowWorkflow {
  return new TicketViewWindowWorkflow(
    store,
    defaultTicketViewWindowValidator(),
    clockValue,
    [],
    defaultTicketViewWindowEngine(flagsValue),
  );
}
