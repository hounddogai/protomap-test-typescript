import * as clock from "../../../../kit/clock.js";
import { FunnelEntryEngine, defaultFunnelEntryEngine } from "./funnel-entry-engine.js";
import { FunnelEntryValidator, defaultFunnelEntryValidator } from "./funnel-entry-rules.js";
import { FunnelEntryStore } from "./funnel-entry-store.js";

/** Moves funnel entries through their life cycle and keeps a journal of what it did. */
export class FunnelEntryDesk {
  store: FunnelEntryStore;
  validator: FunnelEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelEntryEngine;

  constructor(
    store: FunnelEntryStore,
    validator: FunnelEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelEntryEngine,
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
      throw new Error(`funnel entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFunnelEntryDesk(store: FunnelEntryStore, clockValue: clock.Clock): FunnelEntryDesk {
  return new FunnelEntryDesk(store, defaultFunnelEntryValidator(), clockValue, [], defaultFunnelEntryEngine());
}
