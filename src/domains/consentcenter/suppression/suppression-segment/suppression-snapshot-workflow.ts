import * as clock from "../../../../kit/clock.js";
import { SuppressionSnapshotValidator, defaultSuppressionSnapshotValidator } from "./suppression-snapshot-rules.js";
import { SuppressionSnapshotStore } from "./suppression-snapshot-store.js";

/** Moves suppression snapshots through their life cycle and keeps a journal of what it did. */
export class SuppressionSnapshotManager {
  store: SuppressionSnapshotStore;
  validator: SuppressionSnapshotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SuppressionSnapshotStore,
    validator: SuppressionSnapshotValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression snapshot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression snapshot ${code} not found`);
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

export function newSuppressionSnapshotManager(store: SuppressionSnapshotStore, clockValue: clock.Clock): SuppressionSnapshotManager {
  return new SuppressionSnapshotManager(store, defaultSuppressionSnapshotValidator(), clockValue, []);
}
