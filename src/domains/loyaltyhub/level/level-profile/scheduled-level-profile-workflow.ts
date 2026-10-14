import * as clock from "../../../../kit/clock.js";
import {
  ScheduledLevelProfileValidator,
  defaultScheduledLevelProfileValidator,
} from "./scheduled-level-profile-rules.js";
import { ScheduledLevelProfileStore } from "./scheduled-level-profile-store.js";

/** Moves scheduled level profiles through their life cycle and keeps a journal of what it did. */
export class ScheduledLevelProfileDesk {
  store: ScheduledLevelProfileStore;
  validator: ScheduledLevelProfileValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledLevelProfileStore,
    validator: ScheduledLevelProfileValidator,
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
      throw new Error(`scheduled level profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled level profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newScheduledLevelProfileDesk(store: ScheduledLevelProfileStore, clockValue: clock.Clock): ScheduledLevelProfileDesk {
  return new ScheduledLevelProfileDesk(store, defaultScheduledLevelProfileValidator(), clockValue, []);
}
