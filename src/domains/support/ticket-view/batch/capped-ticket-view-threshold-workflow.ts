import * as clock from "../../../../kit/clock.js";
import {
  CappedTicketViewThresholdValidator,
  defaultCappedTicketViewThresholdValidator,
} from "./capped-ticket-view-threshold-rules.js";
import { CappedTicketViewThresholdStore } from "./capped-ticket-view-threshold-store.js";

/** Moves capped ticket view thresholds through their life cycle and keeps a journal of what it did. */
export class CappedTicketViewThresholdWorkflow {
  store: CappedTicketViewThresholdStore;
  validator: CappedTicketViewThresholdValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedTicketViewThresholdStore,
    validator: CappedTicketViewThresholdValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped ticket view threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped ticket view threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newCappedTicketViewThresholdWorkflow(store: CappedTicketViewThresholdStore, clockValue: clock.Clock): CappedTicketViewThresholdWorkflow {
  return new CappedTicketViewThresholdWorkflow(store, defaultCappedTicketViewThresholdValidator(), clockValue, []);
}
