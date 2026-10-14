import * as clock from "../../../../kit/clock.js";
import {
  ScheduledInviteAllocationValidator,
  defaultScheduledInviteAllocationValidator,
} from "./scheduled-invite-allocation-rules.js";
import { ScheduledInviteAllocationStore } from "./scheduled-invite-allocation-store.js";

/** Moves scheduled invite allocations through their life cycle and keeps a journal of what it did. */
export class ScheduledInviteAllocationCoordinator {
  store: ScheduledInviteAllocationStore;
  validator: ScheduledInviteAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledInviteAllocationStore,
    validator: ScheduledInviteAllocationValidator,
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
      throw new Error(`scheduled invite allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled invite allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledInviteAllocationCoordinator(store: ScheduledInviteAllocationStore, clockValue: clock.Clock): ScheduledInviteAllocationCoordinator {
  return new ScheduledInviteAllocationCoordinator(store, defaultScheduledInviteAllocationValidator(), clockValue, []);
}
