import * as clock from "../../../../kit/clock.js";
import {
  LegacySenderSnapshotValidator,
  defaultLegacySenderSnapshotValidator,
} from "./legacy-sender-snapshot-rules.js";
import { LegacySenderSnapshotStore } from "./legacy-sender-snapshot-store.js";

/** Moves legacy sender snapshots through their life cycle and keeps a journal of what it did. */
export class LegacySenderSnapshotDesk {
  store: LegacySenderSnapshotStore;
  validator: LegacySenderSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacySenderSnapshotStore,
    validator: LegacySenderSnapshotValidator,
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
      throw new Error(`legacy sender snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy sender snapshot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newLegacySenderSnapshotDesk(store: LegacySenderSnapshotStore, clockValue: clock.Clock): LegacySenderSnapshotDesk {
  return new LegacySenderSnapshotDesk(store, defaultLegacySenderSnapshotValidator(), clockValue, []);
}
