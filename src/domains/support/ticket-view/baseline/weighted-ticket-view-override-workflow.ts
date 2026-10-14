import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedTicketViewOverrideEngine,
  defaultWeightedTicketViewOverrideEngine,
} from "./weighted-ticket-view-override-engine.js";
import {
  WeightedTicketViewOverrideValidator,
  defaultWeightedTicketViewOverrideValidator,
} from "./weighted-ticket-view-override-rules.js";
import { WeightedTicketViewOverrideStore } from "./weighted-ticket-view-override-store.js";

/** Moves weighted ticket view overrides through their life cycle and keeps a journal of what it did. */
export class WeightedTicketViewOverrideService {
  store: WeightedTicketViewOverrideStore;
  validator: WeightedTicketViewOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedTicketViewOverrideEngine;

  constructor(
    store: WeightedTicketViewOverrideStore,
    validator: WeightedTicketViewOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedTicketViewOverrideEngine,
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
      throw new Error(`weighted ticket view override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted ticket view override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted ticket view override ${code} not found`);
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

export function newWeightedTicketViewOverrideService(store: WeightedTicketViewOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedTicketViewOverrideService {
  return new WeightedTicketViewOverrideService(
    store,
    defaultWeightedTicketViewOverrideValidator(),
    clockValue,
    [],
    defaultWeightedTicketViewOverrideEngine(flagsValue),
  );
}
