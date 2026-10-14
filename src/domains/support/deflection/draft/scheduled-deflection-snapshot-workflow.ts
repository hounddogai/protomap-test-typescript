import * as clock from "../../../../kit/clock.js";
import {
  ScheduledDeflectionSnapshotValidator,
  defaultScheduledDeflectionSnapshotValidator,
} from "./scheduled-deflection-snapshot-rules.js";
import { ScheduledDeflectionSnapshotStore } from "./scheduled-deflection-snapshot-store.js";

/** Moves scheduled deflection snapshots through their life cycle and keeps a journal of what it did. */
export class ScheduledDeflectionSnapshotDesk {
  store: ScheduledDeflectionSnapshotStore;
  validator: ScheduledDeflectionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledDeflectionSnapshotStore,
    validator: ScheduledDeflectionSnapshotValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newScheduledDeflectionSnapshotDesk(store: ScheduledDeflectionSnapshotStore, clockValue: clock.Clock): ScheduledDeflectionSnapshotDesk {
  return new ScheduledDeflectionSnapshotDesk(store, defaultScheduledDeflectionSnapshotValidator(), clockValue, []);
}
