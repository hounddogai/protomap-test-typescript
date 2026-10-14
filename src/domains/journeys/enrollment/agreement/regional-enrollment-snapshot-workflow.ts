import * as clock from "../../../../kit/clock.js";
import {
  RegionalEnrollmentSnapshotValidator,
  defaultRegionalEnrollmentSnapshotValidator,
} from "./regional-enrollment-snapshot-rules.js";
import { RegionalEnrollmentSnapshotStore } from "./regional-enrollment-snapshot-store.js";

/** Moves regional enrollment snapshots through their life cycle and keeps a journal of what it did. */
export class RegionalEnrollmentSnapshotDesk {
  store: RegionalEnrollmentSnapshotStore;
  validator: RegionalEnrollmentSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalEnrollmentSnapshotStore,
    validator: RegionalEnrollmentSnapshotValidator,
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
      throw new Error(`regional enrollment snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional enrollment snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRegionalEnrollmentSnapshotDesk(store: RegionalEnrollmentSnapshotStore, clockValue: clock.Clock): RegionalEnrollmentSnapshotDesk {
  return new RegionalEnrollmentSnapshotDesk(store, defaultRegionalEnrollmentSnapshotValidator(), clockValue, []);
}
