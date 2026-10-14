import * as clock from "../../../../kit/clock.js";
import {
  ScheduledPlacementNoticeValidator,
  defaultScheduledPlacementNoticeValidator,
} from "./scheduled-placement-notice-rules.js";
import { ScheduledPlacementNoticeStore } from "./scheduled-placement-notice-store.js";

/** Moves scheduled placement notices through their life cycle and keeps a journal of what it did. */
export class ScheduledPlacementNoticeDesk {
  store: ScheduledPlacementNoticeStore;
  validator: ScheduledPlacementNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledPlacementNoticeStore,
    validator: ScheduledPlacementNoticeValidator,
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
      throw new Error(`scheduled placement notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled placement notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledPlacementNoticeDesk(store: ScheduledPlacementNoticeStore, clockValue: clock.Clock): ScheduledPlacementNoticeDesk {
  return new ScheduledPlacementNoticeDesk(store, defaultScheduledPlacementNoticeValidator(), clockValue, []);
}
