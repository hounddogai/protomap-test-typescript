import * as clock from "../../../../kit/clock.js";
import {
  LenientTicketViewMetricValidator,
  defaultLenientTicketViewMetricValidator,
} from "./lenient-ticket-view-metric-rules.js";
import { LenientTicketViewMetricStore } from "./lenient-ticket-view-metric-store.js";

/** Moves lenient ticket view metrics through their life cycle and keeps a journal of what it did. */
export class LenientTicketViewMetricManager {
  store: LenientTicketViewMetricStore;
  validator: LenientTicketViewMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientTicketViewMetricStore,
    validator: LenientTicketViewMetricValidator,
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
      throw new Error(`lenient ticket view metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient ticket view metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newLenientTicketViewMetricManager(store: LenientTicketViewMetricStore, clockValue: clock.Clock): LenientTicketViewMetricManager {
  return new LenientTicketViewMetricManager(store, defaultLenientTicketViewMetricValidator(), clockValue, []);
}
