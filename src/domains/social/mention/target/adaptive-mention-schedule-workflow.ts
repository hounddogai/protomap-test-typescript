import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveMentionScheduleValidator,
  defaultAdaptiveMentionScheduleValidator,
} from "./adaptive-mention-schedule-rules.js";
import { AdaptiveMentionScheduleStore } from "./adaptive-mention-schedule-store.js";

/** Moves adaptive mention schedules through their life cycle and keeps a journal of what it did. */
export class AdaptiveMentionScheduleWorkflow {
  store: AdaptiveMentionScheduleStore;
  validator: AdaptiveMentionScheduleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveMentionScheduleStore,
    validator: AdaptiveMentionScheduleValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive mention schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive mention schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveMentionScheduleWorkflow(store: AdaptiveMentionScheduleStore, clockValue: clock.Clock): AdaptiveMentionScheduleWorkflow {
  return new AdaptiveMentionScheduleWorkflow(store, defaultAdaptiveMentionScheduleValidator(), clockValue, []);
}
