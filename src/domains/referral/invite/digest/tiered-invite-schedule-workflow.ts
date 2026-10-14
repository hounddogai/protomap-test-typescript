import * as clock from "../../../../kit/clock.js";
import {
  TieredInviteScheduleValidator,
  defaultTieredInviteScheduleValidator,
} from "./tiered-invite-schedule-rules.js";
import { TieredInviteScheduleStore } from "./tiered-invite-schedule-store.js";

/** Moves tiered invite schedules through their life cycle and keeps a journal of what it did. */
export class TieredInviteScheduleWorkflow {
  store: TieredInviteScheduleStore;
  validator: TieredInviteScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredInviteScheduleStore,
    validator: TieredInviteScheduleValidator,
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
      throw new Error(`tiered invite schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered invite schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newTieredInviteScheduleWorkflow(store: TieredInviteScheduleStore, clockValue: clock.Clock): TieredInviteScheduleWorkflow {
  return new TieredInviteScheduleWorkflow(store, defaultTieredInviteScheduleValidator(), clockValue, []);
}
