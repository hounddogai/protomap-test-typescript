import * as clock from "../../../../kit/clock.js";
import {
  RegionalWaitSnapshotValidator,
  defaultRegionalWaitSnapshotValidator,
} from "./regional-wait-snapshot-rules.js";
import { RegionalWaitSnapshotStore } from "./regional-wait-snapshot-store.js";

/** Moves regional wait snapshots through their life cycle and keeps a journal of what it did. */
export class RegionalWaitSnapshotWorkflow {
  store: RegionalWaitSnapshotStore;
  validator: RegionalWaitSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalWaitSnapshotStore,
    validator: RegionalWaitSnapshotValidator,
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
      throw new Error(`regional wait snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional wait snapshot ${code} not found`);
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

export function newRegionalWaitSnapshotWorkflow(store: RegionalWaitSnapshotStore, clockValue: clock.Clock): RegionalWaitSnapshotWorkflow {
  return new RegionalWaitSnapshotWorkflow(store, defaultRegionalWaitSnapshotValidator(), clockValue, []);
}
