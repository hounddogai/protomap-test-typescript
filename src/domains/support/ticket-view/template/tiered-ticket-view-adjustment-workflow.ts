import * as clock from "../../../../kit/clock.js";
import {
  TieredTicketViewAdjustmentValidator,
  defaultTieredTicketViewAdjustmentValidator,
} from "./tiered-ticket-view-adjustment-rules.js";
import { TieredTicketViewAdjustmentStore } from "./tiered-ticket-view-adjustment-store.js";

/** Moves tiered ticket view adjustments through their life cycle and keeps a journal of what it did. */
export class TieredTicketViewAdjustmentDesk {
  store: TieredTicketViewAdjustmentStore;
  validator: TieredTicketViewAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredTicketViewAdjustmentStore,
    validator: TieredTicketViewAdjustmentValidator,
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
      throw new Error(`tiered ticket view adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered ticket view adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newTieredTicketViewAdjustmentDesk(store: TieredTicketViewAdjustmentStore, clockValue: clock.Clock): TieredTicketViewAdjustmentDesk {
  return new TieredTicketViewAdjustmentDesk(store, defaultTieredTicketViewAdjustmentValidator(), clockValue, []);
}
