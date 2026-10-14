import * as clock from "../../../../kit/clock.js";
import { TicketViewTierEngine, defaultTicketViewTierEngine } from "./ticket-view-tier-engine.js";
import { TicketViewTierValidator, defaultTicketViewTierValidator } from "./ticket-view-tier-rules.js";
import { TicketViewTierStore } from "./ticket-view-tier-store.js";

/** Moves ticket view tiers through their life cycle and keeps a journal of what it did. */
export class TicketViewTierCoordinator {
  store: TicketViewTierStore;
  validator: TicketViewTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TicketViewTierEngine;

  constructor(
    store: TicketViewTierStore,
    validator: TicketViewTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TicketViewTierEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`ticket view tier ${code} not found`);
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

export function newTicketViewTierCoordinator(store: TicketViewTierStore, clockValue: clock.Clock): TicketViewTierCoordinator {
  return new TicketViewTierCoordinator(
    store,
    defaultTicketViewTierValidator(),
    clockValue,
    [],
    defaultTicketViewTierEngine(),
  );
}
