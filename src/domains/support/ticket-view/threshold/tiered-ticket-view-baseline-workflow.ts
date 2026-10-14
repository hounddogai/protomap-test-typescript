import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredTicketViewBaselineEngine,
  defaultTieredTicketViewBaselineEngine,
} from "./tiered-ticket-view-baseline-engine.js";
import {
  TieredTicketViewBaselineValidator,
  defaultTieredTicketViewBaselineValidator,
} from "./tiered-ticket-view-baseline-rules.js";
import { TieredTicketViewBaselineStore } from "./tiered-ticket-view-baseline-store.js";

/** Moves tiered ticket view baselines through their life cycle and keeps a journal of what it did. */
export class TieredTicketViewBaselineManager {
  store: TieredTicketViewBaselineStore;
  validator: TieredTicketViewBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTicketViewBaselineEngine;

  constructor(
    store: TieredTicketViewBaselineStore,
    validator: TieredTicketViewBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTicketViewBaselineEngine,
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
      throw new Error(`tiered ticket view baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered ticket view baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered ticket view baseline ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredTicketViewBaselineManager(store: TieredTicketViewBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredTicketViewBaselineManager {
  return new TieredTicketViewBaselineManager(
    store,
    defaultTieredTicketViewBaselineValidator(),
    clockValue,
    [],
    defaultTieredTicketViewBaselineEngine(flagsValue),
  );
}
