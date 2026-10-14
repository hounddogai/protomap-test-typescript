import * as clock from "../../../../kit/clock.js";
import {
  DefaultFrequencySnapshotValidator,
  defaultDefaultFrequencySnapshotValidator,
} from "./default-frequency-snapshot-rules.js";
import { DefaultFrequencySnapshotStore } from "./default-frequency-snapshot-store.js";

/** Moves default frequency snapshots through their life cycle and keeps a journal of what it did. */
export class DefaultFrequencySnapshotService {
  store: DefaultFrequencySnapshotStore;
  validator: DefaultFrequencySnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultFrequencySnapshotStore,
    validator: DefaultFrequencySnapshotValidator,
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
      throw new Error(`default frequency snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default frequency snapshot ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultFrequencySnapshotService(store: DefaultFrequencySnapshotStore, clockValue: clock.Clock): DefaultFrequencySnapshotService {
  return new DefaultFrequencySnapshotService(store, defaultDefaultFrequencySnapshotValidator(), clockValue, []);
}
