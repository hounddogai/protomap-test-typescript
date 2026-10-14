import * as clock from "../../../../kit/clock.js";
import {
  ScheduledDeflectionSlotValidator,
  defaultScheduledDeflectionSlotValidator,
} from "./scheduled-deflection-slot-rules.js";
import { ScheduledDeflectionSlotStore } from "./scheduled-deflection-slot-store.js";

/** Moves scheduled deflection slots through their life cycle and keeps a journal of what it did. */
export class ScheduledDeflectionSlotWorkflow {
  store: ScheduledDeflectionSlotStore;
  validator: ScheduledDeflectionSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledDeflectionSlotStore,
    validator: ScheduledDeflectionSlotValidator,
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
      throw new Error(`scheduled deflection slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newScheduledDeflectionSlotWorkflow(store: ScheduledDeflectionSlotStore, clockValue: clock.Clock): ScheduledDeflectionSlotWorkflow {
  return new ScheduledDeflectionSlotWorkflow(store, defaultScheduledDeflectionSlotValidator(), clockValue, []);
}
